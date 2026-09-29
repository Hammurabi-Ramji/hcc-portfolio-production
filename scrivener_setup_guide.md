# Scrivener 3 FDA Compliance Project - Quick Setup Guide

## 🚀 IMMEDIATE IMPLEMENTATION STEPS

### Pre-Setup Requirements:
- [ ] Scrivener 3 for Windows installed
- [ ] Administrative access to create folders
- [ ] Dedicated compliance folder created (e.g., `C:\FDA_Compliance\`)

---

## ⚡ 15-MINUTE QUICK START

### Step 1: Create New Project (2 minutes)
1. Open Scrivener 3
2. File → New Project
3. Choose "Blank Project"
4. Project Name: `FDA_Compliance_Dossier_2025`
5. Location: Your compliance folder
6. Click "Create"

### Step 2: Import Binder Structure (5 minutes)
```
Right-click "Manuscript" folder → Add → Folder
Create these main folders in order:

01 - Cover & Executive Documents
02 - Quality Management System  
03 - GMP Compliance Documentation
04 - Laboratory Controls
05 - Facilities & Equipment
06 - Materials Management
07 - Production & Process Controls
08 - Packaging & Labeling
09 - Complaints, Recalls & CAPA
10 - Training & Personnel
11 - FDA Inspection Management
12 - Appendices & References
```

### Step 3: Setup Document Templates (5 minutes)
1. Project → Project Templates → Document Templates
2. Add New Template → "SOP Template"
3. Paste SOP template content from main guide
4. Repeat for: CAPA Form, FDA Request Log, Checklist Template
5. Save templates

### Step 4: Configure Metadata (3 minutes)
1. Project → Meta-Data Settings
2. Add these custom fields:
   - Document_Type (Text)
   - Effective_Date (Date)
   - Review_Date (Date) 
   - Document_Number (Text)
   - Approval_Status (List: Draft, Under Review, Approved)
   - Owner (Text)

---

## 📁 FOLDER STRUCTURE IMPORT

### Copy-Paste Folder Creation Script:
```
Right-click in Binder → Add Folder → Rename to:

UNDER "01 - Cover & Executive Documents":
├── Cover Page Template
├── Table of Contents
├── Executive Compliance Statement
└── FDA Inspection Protocol Overview

UNDER "02 - Quality Management System":
├── Quality Manual Master
├── Management Review Records
│   ├── Q1 Management Review
│   ├── Q2 Management Review  
│   ├── Q3 Management Review
│   └── Q4 Management Review
├── Internal Audit Reports
└── CAPA Tracking

(Continue pattern for all 12 main sections...)
```

---

## 🔧 ESSENTIAL CONFIGURATIONS

### Auto-Backup Setup:
1. Scrivener → Preferences → Backup
2. ✅ Turn on automatic backups
3. ✅ Back up with each manual save
4. ✅ Backup before syncing
5. Set backup folder: `[Your_Compliance_Folder]\Backups\`
6. Keep: 25 backup files

### Document Auto-Numbering:
1. Format → Options → Substitutions
2. Add substitution:
   - Replace: `<$docnum>`
   - With: `SOP-<$n:0001>`
3. Use in document headers

### Compilation Settings:
1. File → Compile
2. Format: Custom → Create new format "FDA Compliance"
3. Section Types → Set header/footer format
4. Include: Auto-generated Table of Contents
5. Save format for reuse

---

## 📋 TEMPLATE QUICK-ADD

### SOP Template (Copy-Paste Ready):
```
STANDARD OPERATING PROCEDURE

Document Number: SOP-<$docnum>
Title: [Enter SOP Title]
Effective Date: <$shortdate>
Revision: 1.0
Page <$p> of <$pagecount>

PURPOSE:
[Describe why this SOP exists]

SCOPE:
[Define what this SOP covers]

RESPONSIBILITIES:
Quality Manager: [Define responsibility]
Production Manager: [Define responsibility]
Operators: [Define responsibility]

PROCEDURE:
1. [Step one with clear action]
2. [Step two with clear action]
3. [Continue numbering...]

REFERENCES:
21 CFR Part [Reference number]
[Internal procedures referenced]

RECORDS:
[List forms/records generated]

TRAINING:
[Training requirements]

REVISION HISTORY:
Rev | Date | Change Description | Author | Approved By
1.0 | <$shortdate> | Initial issue | [Name] | [Name]

APPROVALS:
Prepared: _________________ Date: _______
Reviewed: _________________ Date: _______  
Approved: _________________ Date: _______
```

### CAPA Form Template (Copy-Paste Ready):
```
CORRECTIVE AND PREVENTIVE ACTION (CAPA)

CAPA #: CAPA-<$year>-<$n:001>
Date Opened: <$fulldate>
Opened By: [Name]
Department: [Department]

PROBLEM IDENTIFICATION:
Source: ☐ Audit ☐ Complaint ☐ Inspection ☐ Other:_____
Description:
[Detailed problem description]

ROOT CAUSE ANALYSIS:
Method: ☐ 5-Why ☐ Fishbone ☐ Other:_____
Root Cause:
[Root cause identified]

CORRECTIVE ACTION:
Immediate Action:
[What was done immediately]

Long-term Correction:
Action | Owner | Due Date | Status
[Action items in table format]

PREVENTIVE ACTION:
Preventive Measures:
[Describe preventive measures]

VERIFICATION:
Method: [How effectiveness will be verified]
Results: [Results of verification]
Effective: ☐ Yes ☐ No

CLOSURE:
Closed By: _________________ Date: _______
QA Approval: _________________ Date: _______
```

---

## 🎯 COLLECTIONS SETUP

### Create Smart Collections:
1. View → Collections → Add Collection
2. Set up these collections:

**"Action Items"** - Search criteria:
- Text contains: "Action Item" OR "TODO" OR "Follow-up"

**"Due This Week"** - Search criteria:  
- Custom metadata "Review_Date" within 7 days

**"FDA Critical Docs"** - Manual collection:
- Add key documents FDA typically requests

**"Pending Approval"** - Search criteria:
- Custom metadata "Approval_Status" equals "Under Review"

---

## 📊 DASHBOARD SETUP

### Project Notes Dashboard:
1. Add document to Research folder: "Compliance Dashboard"
2. Use this template:

```
# FDA COMPLIANCE DASHBOARD
Updated: <$fulldate>

## DOCUMENT STATUS
Total SOPs: [Count]
├── Approved: [Count]
├── Under Review: [Count]  
└── Draft: [Count]

## CAPA STATUS
Open CAPAs: [Count]
├── Overdue: [Count]
├── Due This Week: [Count]
└── On Track: [Count]

## TRAINING STATUS
Required Training: [Count]
├── Completed: [%]
├── In Progress: [%]
└── Not Started: [%]

## RECENT ACTIVITIES
- [Activity 1]
- [Activity 2]  
- [Activity 3]

## UPCOMING DEADLINES
- [Deadline 1] - [Date]
- [Deadline 2] - [Date]
- [Deadline 3] - [Date]

## ACTION ITEMS
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]
```

---

## ✅ VALIDATION CHECKLIST

### Post-Setup Verification:
- [ ] All 12 main folders created
- [ ] Templates accessible in Project Templates
- [ ] Metadata fields configured
- [ ] Auto-backup enabled
- [ ] Collections created and populated
- [ ] Compilation format saved
- [ ] Dashboard document created
- [ ] Test document created using template
- [ ] Test compilation successful
- [ ] Backup file created successfully

---

## 🔄 DAILY USE WORKFLOW

### Morning Routine (5 minutes):
1. Open FDA Compliance project
2. Check Dashboard for updates
3. Review "Action Items" collection
4. Check "Due This Week" collection

### Document Creation:
1. Right-click appropriate folder
2. Add → New from Template
3. Choose relevant template
4. Fill in metadata fields
5. Save document

### Weekly Review:
1. Update Dashboard numbers
2. Review CAPA effectiveness
3. Check backup integrity
4. Update action items

---

## 🆘 TROUBLESHOOTING

### Common Issues:
**Templates not appearing:**
- Check Project → Project Templates → Document Templates
- Verify template saved properly

**Metadata not showing:**
- Inspector panel → Custom Meta-Data tab
- Project → Meta-Data Settings → verify fields

**Compilation errors:**
- File → Compile → Check format settings
- Verify all documents have content

**Backup not working:**
- Preferences → Backup → Check settings
- Verify backup folder permissions

---

## 📞 SUPPORT RESOURCES

### Scrivener 3 Help:
- Help → Scrivener Manual (F1)
- Help → Interactive Tutorial
- Video tutorials: literature-and-latte.com

### FDA Guidance:
- FDA.gov guidance documents
- 21 CFR online database
- Industry working groups

---

*This quick setup guide gets your FDA compliance system operational in 15 minutes. For full implementation details, refer to the main Scrivener Binder System guide.*