#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Opportunities Portal (بوابة الفرص) - Standalone Data Validation Script
Validates data/opportunities.json against data/schema.json with Arabic reporting.
Reuses and enforces validation rules from js/data.js and data/schema.json.
"""

import sys
import json
import re
from datetime import datetime
from pathlib import Path

# Fix Windows console encoding for Arabic characters
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Default paths relative to script location
SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DEFAULT_SCHEMA_PATH = ROOT_DIR / "data" / "schema.json"
DEFAULT_DATA_PATH = ROOT_DIR / "data" / "opportunities.json"

ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]+$")
URL_REGEX = re.compile(r"^https?://.+", re.IGNORECASE)
DATE_REGEX = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def is_valid_calendar_date(date_str: str) -> bool:
    """Validate date format YYYY-MM-DD and true calendar validity."""
    if not isinstance(date_str, str) or not DATE_REGEX.match(date_str):
        return False
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def run_validation():
    # Allow custom data path as command line argument
    target_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_DATA_PATH

    print("=" * 60)
    print("🔍 بدء فحص بيانات بوابة الفرص (Opportunities Portal Validation)")
    try:
        rel_path = target_path.relative_to(Path.cwd())
    except ValueError:
        rel_path = target_path
    print(f"📁 ملف البيانات: {rel_path}")
    print("=" * 60)

    # 1. Read schema
    if not DEFAULT_SCHEMA_PATH.exists():
        print(f"❌ خطأ فادح: ملف المخطط غير موجود في المسار: {DEFAULT_SCHEMA_PATH}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(DEFAULT_SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema = json.load(f)
    except Exception as e:
        print(f"❌ خطأ فادح: فشل قراءة أو تحليل ملف المخطط (schema.json): {e}", file=sys.stderr)
        sys.exit(1)

    # 2. Read opportunities data
    if not target_path.exists():
        print(f"❌ خطأ: ملف البيانات غير موجود في المسار: {target_path}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(target_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ خطأ في صياغة ملف JSON: بنية الملف غير صالحة:\n   {e}", file=sys.stderr)
        sys.exit(1)

    # 3. Ensure root is an array
    if not isinstance(data, list):
        print("❌ خطأ في البنية الأساسية: يجب أن يكون المحتوى مصفوفة (Array) تحتوي على كائنات الفرص.", file=sys.stderr)
        sys.exit(1)

    item_schema = schema.get("items", {})
    required_fields = item_schema.get("required", [])
    properties = item_schema.get("properties", {})
    allowed_properties = set(properties.keys())

    allowed_types = set(properties.get("type", {}).get("enum", ["scholarship", "course", "internship"]))
    allowed_study_levels = set(properties.get("study_levels", {}).get("items", {}).get("enum", [
        "high_school", "bachelor", "master", "phd", "not_applicable"
    ]))
    allowed_funding = set(properties.get("funding_type", {}).get("enum", [
        "fully_funded", "partially_funded", "free", "paid_internship", "unpaid"
    ]))
    allowed_eligibility = set(properties.get("yemeni_eligibility", {}).get("enum", [
        "eligible", "warning", "excluded", "unspecified"
    ]))

    seen_ids = {}  # id -> first row number
    opportunity_errors = []

    # 4. Validate each opportunity record
    for index, item in enumerate(data):
        row_num = index + 1
        errors = []

        if not isinstance(item, dict):
            opportunity_errors.append({
                "index": row_num,
                "id": "غير محدد",
                "title": "عنصر غير صالح",
                "errors": [{"field": "root", "message": "السجل ليس كائناً برمجياً صالحاً (JSON Object)."}]
            })
            continue

        current_id = item.get("id")
        current_title = item.get("title") or item.get("title_en") or "بدون عنوان"

        # A. Required fields check
        for req_field in required_fields:
            if req_field not in item or item[req_field] is None and req_field != "deadline":
                errors.append({"field": req_field, "message": "حقل إلزامي مفقود."})

        # B. Unexpected fields check (additionalProperties: false)
        if item_schema.get("additionalProperties") is False:
            for prop in item.keys():
                if prop not in allowed_properties:
                    errors.append({"field": prop, "message": "حقل غير معرّف في المخطط (غير مصرح به)."})

        # C. ID Validation
        if "id" in item:
            val_id = item["id"]
            if not isinstance(val_id, str) or not val_id.strip():
                errors.append({"field": "id", "message": "معرّف الفرصة يجب أن يكون نصاً غير فارغ."})
            elif not ID_REGEX.match(val_id):
                errors.append({
                    "field": "id",
                    "message": f"معرّف الفرصة ({val_id}) غير صالح. يسمح فقط بالأحرف الإنجليزية والأرقام والشرطة (- أو _)."
                })
            else:
                if val_id not in seen_ids:
                    seen_ids[val_id] = row_num
                else:
                    errors.append({
                        "field": "id",
                        "message": f'معرّف الفرصة مكرر: "{val_id}" (تم استخدامه سابقاً في السجل رقم {seen_ids[val_id]}).'
                    })

        # D. Title Validation
        if "title" in item:
            val = item["title"]
            if not isinstance(val, str) or len(val.strip()) < 3:
                errors.append({"field": "title", "message": "العنوان العربي يجب أن يكون نصاً لا يقل عن 3 أحرف."})

        # E. Title EN Validation (Optional)
        if "title_en" in item and item["title_en"] is not None:
            if not isinstance(item["title_en"], str):
                errors.append({"field": "title_en", "message": "العنوان الإنجليزي يجب أن يكون نصاً."})

        # F. Organization Validation
        if "organization" in item:
            val = item["organization"]
            if not isinstance(val, str) or len(val.strip()) < 2:
                errors.append({"field": "organization", "message": "اسم الجهة المانحة يجب أن يكون نصاً لا يقل عن حرفين."})

        # G. Type Enum Validation
        if "type" in item:
            val = item["type"]
            if val not in allowed_types:
                errors.append({
                    "field": "type",
                    "message": f"نوع الفرصة ({val}) غير صالح. القيم المسموحة: [{', '.join(sorted(allowed_types))}]."
                })

        # H. Study Levels Validation
        if "study_levels" in item:
            val = item["study_levels"]
            if not isinstance(val, list) or len(val) == 0:
                errors.append({"field": "study_levels", "message": "المراحل الدراسية يجب أن تكون مصفوفة غير فارغة."})
            else:
                for idx, lvl in enumerate(val):
                    if lvl not in allowed_study_levels:
                        errors.append({
                            "field": f"study_levels[{idx}]",
                            "message": f"المرحلة الدراسية ({lvl}) غير صالحة. القيم المسموحة: [{', '.join(sorted(allowed_study_levels))}]."
                        })

        # I. Country Validation
        if "country" in item:
            val = item["country"]
            if not isinstance(val, str) or len(val.strip()) < 2:
                errors.append({"field": "country", "message": "الدولة يجب أن تكون نصاً لا يقل عن حرفين."})

        # J. Funding Type Validation
        if "funding_type" in item:
            val = item["funding_type"]
            if val not in allowed_funding:
                errors.append({
                    "field": "funding_type",
                    "message": f"نوع التمويل ({val}) غير صالح. القيم المسموحة: [{', '.join(sorted(allowed_funding))}]."
                })

        # K. Deadline Validation
        if "deadline" in item:
            val = item["deadline"]
            if val is not None:
                if not isinstance(val, str):
                    errors.append({"field": "deadline", "message": "الموعد النهائي يجب أن يكون نصاً بصيغة YYYY-MM-DD أو null."})
                elif not is_valid_calendar_date(val):
                    errors.append({
                        "field": "deadline",
                        "message": f"تاريخ الموعد النهائي ({val}) غير صالح تقويمياً أو لا يطابق صيغة YYYY-MM-DD."
                    })

        # L. Yemeni Eligibility Validation
        if "yemeni_eligibility" in item:
            val = item["yemeni_eligibility"]
            if val not in allowed_eligibility:
                errors.append({
                    "field": "yemeni_eligibility",
                    "message": f"حالة أهلية اليمنيين ({val}) غير صالحة. القيم المسموحة: [{', '.join(sorted(allowed_eligibility))}]."
                })

        # M. Summary Validation
        if "summary" in item:
            val = item["summary"]
            if not isinstance(val, str) or len(val.strip()) < 10:
                errors.append({"field": "summary", "message": "الملخص يجب أن يكون نصاً لا يقل عن 10 أحرف."})

        # N. Description Validation
        if "description" in item:
            val = item["description"]
            if not isinstance(val, str) or len(val.strip()) < 20:
                errors.append({"field": "description", "message": "الوصف التفصيلي يجب أن يكون نصاً لا يقل عن 20 حرفاً."})

        # O. Eligibility Criteria Array Validation
        if "eligibility_criteria" in item:
            val = item["eligibility_criteria"]
            if not isinstance(val, list) or len(val) == 0:
                errors.append({"field": "eligibility_criteria", "message": "شروط التقديم يجب أن تكون مصفوفة غير فارغة."})
            else:
                for idx, crit in enumerate(val):
                    if not isinstance(crit, str) or not crit.strip():
                        errors.append({"field": f"eligibility_criteria[{idx}]", "message": "شرط التقديم يجب أن يكون نصاً غير فارغ."})

        # P. Benefits Array Validation
        if "benefits" in item:
            val = item["benefits"]
            if not isinstance(val, list) or len(val) == 0:
                errors.append({"field": "benefits", "message": "المزايا يجب أن تكون مصفوفة غير فارغة."})
            else:
                for idx, ben in enumerate(val):
                    if not isinstance(ben, str) or not ben.strip():
                        errors.append({"field": f"benefits[{idx}]", "message": "الميزة يجب أن تكون نصاً غير فارغ."})

        # Q. Source URL Validation
        if "source_url" in item:
            val = item["source_url"]
            if not isinstance(val, str) or not URL_REGEX.match(val):
                errors.append({"field": "source_url", "message": "رابط المصدر الرسمي يجب أن يبدأ بـ https:// أو http://."})

        # R. Verified At Validation
        if "verified_at" in item:
            val = item["verified_at"]
            if not isinstance(val, str) or not is_valid_calendar_date(val):
                errors.append({
                    "field": "verified_at",
                    "message": f"تاريخ التحقق ({val}) يجب أن يكون تاريخاً صالحاً بصيغة YYYY-MM-DD."
                })

        if errors:
            opportunity_errors.append({
                "index": row_num,
                "id": current_id if current_id else "مفقود",
                "title": current_title,
                "errors": errors
            })

    # 5. Display Arabic Report
    total_count = len(data)
    invalid_count = len(opportunity_errors)
    valid_count = total_count - invalid_count
    total_errors = sum(len(item["errors"]) for item in opportunity_errors)

    if invalid_count > 0:
        print("\n❌ تم اكتشاف أخطاء في السجلات التالية:\n")
        for record in opportunity_errors:
            print(f'📌 الفرصة #{record["index"]} [المعرّف: "{record["id"]}"] — «{record["title"]}»:')
            for err in record["errors"]:
                print(f'   ⚠️ الحقل ({err["field"]}): {err["message"]}')
            print("")

    print("=" * 60)
    print("📊 تقرير الفحص النهائي (Validation Summary):")
    print(f"- إجمالي السجلات المفحوصة: {total_count}")
    print(f"- السجلات المطابقة بنجاح: {valid_count}")
    print(f"- السجلات التي تحتوي على أخطاء: {invalid_count}")
    print(f"- إجمالي عدد الأخطاء المكتشفة: {total_errors}")
    print("=" * 60)

    if invalid_count == 0:
        print("✅ نتيجة الفحص: كافة البيانات سليمة ومطابقة للمخطط بنسبة 100%!\n")
        sys.exit(0)
    else:
        print("❌ نتيجة الفحص: فشل التحقق، يرجى تصحيح الأخطاء الموضحة أعلاه.\n")
        sys.exit(1)


if __name__ == "__main__":
    run_validation()
