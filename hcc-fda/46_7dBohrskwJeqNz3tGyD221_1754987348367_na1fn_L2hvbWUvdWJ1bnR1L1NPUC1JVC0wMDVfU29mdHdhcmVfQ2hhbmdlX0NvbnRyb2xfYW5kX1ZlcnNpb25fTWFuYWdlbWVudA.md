# Standard Operating Procedure

## SOP-IT-005: Software Change Control and Version Management

**Category:** Information Technology

**Compliance Areas:** FDA, USDA, cGMP

**Version:** 1.0

**Effective Date:** 2025-12-08

**Author:** Manus AI

---

## 1. Purpose and Scope

This Standard Operating Procedure (SOP) establishes the guidelines and procedures for managing changes to software systems and their versions within large animal pharmaceutical manufacturing operations. The purpose of this SOP is to ensure that all software changes are systematically controlled, documented, reviewed, tested, and approved to maintain data integrity, system reliability, and compliance with regulatory requirements, including those set forth by the Food and Drug Administration (FDA), United States Department of Agriculture (USDA), and Current Good Manufacturing Practices (cGMP). This SOP applies to all software used in critical manufacturing processes, quality control, laboratory operations, and data management that directly or indirectly impacts product quality, safety, and regulatory compliance in large animal pharmaceutical production. This includes, but is not limited to, Manufacturing Execution Systems (MES), Laboratory Information Management Systems (LIMS), Enterprise Resource Planning (ERP) systems modules related to manufacturing, process control software, and any custom-developed applications. The scope encompasses the entire lifecycle of a software change, from initial request to implementation, verification, and retirement, ensuring that all modifications are traceable, auditable, and do not adversely affect the validated state of the systems or the quality of the pharmaceutical products.



## 2. Responsibilities

**2.1. System Owner:** The System Owner is ultimately responsible for the overall integrity and compliance of the software system. This includes ensuring that all software changes are managed according to this SOP, allocating necessary resources for change implementation, and approving major software changes.

**2.2. Change Control Board (CCB):** The CCB is a cross-functional team responsible for reviewing, evaluating, and approving or rejecting proposed software changes. The CCB ensures that changes are necessary, adequately planned, and do not introduce unacceptable risks to product quality, patient safety, or regulatory compliance. The CCB typically includes representatives from IT, Quality Assurance, Manufacturing, and other relevant departments.

**2.3. Information Technology (IT) Department:** The IT Department is responsible for the technical implementation of software changes, including coding, configuration, testing, deployment, and version management. IT personnel ensure that changes are performed in a controlled environment, maintain accurate records of all software versions, and provide technical support throughout the change lifecycle.

**2.4. Quality Assurance (QA) Department:** The QA Department is responsible for overseeing the entire change control process to ensure compliance with internal procedures and external regulations. QA reviews and approves all change requests, test plans, validation protocols, and final change documentation. QA also ensures that appropriate training is conducted and that all quality control measures are met.

**2.5. End-Users/Department Heads:** End-users and Department Heads are responsible for identifying the need for software changes, submitting change requests, participating in user acceptance testing (UAT), and providing feedback on the implemented changes. They are also responsible for ensuring their teams are adequately trained on new or modified software functionalities.

**2.6. Training Department:** The Training Department is responsible for developing and delivering training programs related to software changes. This includes creating training materials, scheduling sessions, and maintaining training records to ensure all affected personnel are proficient in using the modified software systems.



## 3. Detailed Procedures

This section outlines the step-by-step procedures for managing software changes and versions. Each step is critical to ensuring the integrity, reliability, and compliance of software systems within large animal pharmaceutical manufacturing operations.

### 3.1. Change Request Initiation

**3.1.1. Identification of Need:** Any employee identifying a need for a software change (e.g., bug fix, enhancement, new feature, regulatory update) shall initiate the process. The need must be clearly articulated, detailing the problem or improvement, its impact, and proposed solution.

**3.1.2. Submission of Change Request (CR):** The initiator shall complete a formal Software Change Request (SCR) form. This form must include:
    *   **Unique SCR Number:** Automatically generated or assigned by the system.
    *   **Date of Request:** Date when the SCR is submitted.
    *   **Initiator Information:** Name, department, and contact details.
    *   **Software System Affected:** Specific software application or module.
    *   **Type of Change:** (e.g., Corrective Action, Preventive Action, Enhancement, Regulatory Compliance, Emergency Change).
    *   **Detailed Description of Change:** Clear and concise explanation of the proposed change, including current behavior and desired outcome.
    *   **Justification for Change:** Rationale for the change, including benefits, risks, and impact on operations, quality, and compliance.
    *   **Urgency/Priority:** Proposed timeline and criticality of the change.
    *   **Impact Assessment (Initial):** Preliminary assessment of potential impact on other systems, processes, documentation, and training.

**3.1.3. Initial Review by System Owner:** The System Owner shall conduct an initial review of the SCR for completeness and clarity. The System Owner may request additional information or clarification from the initiator. If the SCR is deemed incomplete or unclear, it will be returned to the initiator for revision.

### 3.2. Change Control Board (CCB) Review and Approval

**3.2.1. Scheduling CCB Meeting:** Once the SCR is deemed complete by the System Owner, it will be forwarded to the CCB coordinator. The CCB coordinator will schedule a meeting for the CCB to review the SCR.

**3.2.2. CCB Review and Impact Assessment:** During the CCB meeting, the initiator or System Owner will present the SCR. The CCB will collectively perform a comprehensive impact assessment, considering:
    *   **Regulatory Impact:** Compliance with FDA, USDA, cGMP, and other relevant regulations.
    *   **Quality Impact:** Potential effects on product quality, data integrity, and validated state.
    *   **Operational Impact:** Disruption to manufacturing processes, resource requirements, and downtime.
    *   **Technical Impact:** Compatibility with existing infrastructure, security implications, and system performance.
    *   **Financial Impact:** Costs associated with implementation, testing, and training.
    *   **Risk Assessment:** Identification and evaluation of potential risks associated with the change, and development of mitigation strategies.

**3.2.3. CCB Decision:** Based on the comprehensive impact assessment, the CCB will make one of the following decisions:
    *   **Approve:** The change is approved for implementation. The CCB will assign a priority level and target completion date.
    *   **Reject:** The change is not approved. A clear rationale for rejection will be documented.
    *   **Request for More Information/Revision:** The SCR requires further details or revisions before a decision can be made.
    *   **Defer:** The change is put on hold for future consideration.

**3.2.4. Documentation of CCB Decision:** All CCB decisions, including the rationale, assigned priority, and any conditions for approval, must be formally documented and communicated to all relevant stakeholders. The SCR status will be updated in the change management system.

### 3.3. Software Development and Configuration

**3.3.1. Assignment of Development Team:** Once approved, the SCR will be assigned to the IT development team or an external vendor for implementation.

**3.3.2. Design and Planning:** The development team will create a detailed design specification for the approved change. This includes:
    *   **Technical Design:** How the change will be implemented, including architecture, algorithms, and data structures.
    *   **Test Plan:** A comprehensive plan for testing the change, including unit testing, integration testing, system testing, and user acceptance testing (UAT).
    *   **Rollback Plan:** A contingency plan to revert the system to its previous state in case of unforeseen issues during or after implementation.
    *   **Validation Strategy:** Outline of how the change will be validated to ensure it meets requirements and maintains the validated state.

**3.3.3. Coding and Configuration:** The development team will implement the change in a segregated development or test environment. All code changes must adhere to established coding standards and best practices. Configuration changes must be documented and version-controlled.

**3.3.4. Version Control:** All software code, configurations, and related documentation must be managed under a robust version control system. Each change must be associated with a unique version number, allowing for traceability and the ability to revert to previous versions if necessary. The version control system must record:
    *   **Version Number:** Unique identifier for each iteration of the software.
    *   **Date of Change:** When the version was created.
    *   **Author of Change:** Who made the changes.
    *   **Description of Change:** Link to the SCR and a summary of modifications.
    *   **Baseline:** Identification of the approved baseline for each release.

### 3.4. Testing and Validation

**3.4.1. Unit Testing:** Individual components or modules of the software change will be tested by the development team to ensure they function as intended.

**3.4.2. Integration Testing:** The modified components will be tested with other integrated systems to ensure seamless interaction and data flow.

**3.4.3. System Testing:** The entire software system, including the implemented change, will undergo comprehensive system testing to verify functionality, performance, security, and reliability in a simulated production environment.

**3.4.4. User Acceptance Testing (UAT):** Key end-users will perform UAT to confirm that the implemented change meets their business requirements and operates as expected in a real-world scenario. Any discrepancies or issues identified during UAT must be documented and addressed before proceeding.

**3.4.5. Validation Protocol Execution:** For critical software changes, a formal validation protocol will be executed. This protocol will define the tests to be performed, acceptance criteria, and documentation requirements to demonstrate that the software system consistently meets its intended use and regulatory requirements. This includes:
    *   **Installation Qualification (IQ):** Verification that the software is installed correctly.
    *   **Operational Qualification (OQ):** Verification that the software functions as intended across its operating range.
    *   **Performance Qualification (PQ):** Verification that the software performs consistently and reliably under actual operating conditions.

**3.4.6. Documentation of Test Results:** All test results, including deviations and their resolutions, must be thoroughly documented and reviewed by QA. No software change can proceed to deployment without satisfactory completion of all required testing and validation activities.

### 3.5. Deployment and Implementation

**3.5.1. Pre-Deployment Review:** Before deployment, a final review will be conducted by IT and QA to ensure all prerequisites are met, including:
    *   All testing and validation activities are successfully completed and documented.
    *   All necessary approvals are obtained.
    *   A comprehensive deployment plan is in place.
    *   A rollback plan is ready for execution if needed.

**3.5.2. Deployment Execution:** The software change will be deployed to the production environment according to the approved deployment plan. This may involve scheduled downtime to minimize disruption to manufacturing operations.

**3.5.3. Post-Deployment Verification:** Immediately after deployment, a post-deployment verification will be performed to confirm that the software change has been successfully implemented and the system is functioning correctly in the production environment. This includes:
    *   Basic functionality checks.
    *   Data integrity verification.
    *   System performance monitoring.

**3.5.4. Communication:** All relevant stakeholders will be informed of the successful deployment and any associated changes in system functionality or availability.

### 3.6. Post-Implementation Review and Closure

**3.6.1. Performance Monitoring:** The IT department will continuously monitor the performance and stability of the modified software system in the production environment.

**3.6.2. Post-Implementation Review (PIR):** A PIR will be conducted by the CCB or a designated team within a specified period after deployment (e.g., 30-60 days). The PIR will assess:
    *   Whether the change achieved its intended objectives.
    *   Whether any new issues or risks have emerged.
    *   The effectiveness of the change control process.
    *   Lessons learned for future improvements.

**3.6.3. SCR Closure:** Upon satisfactory completion of the PIR and resolution of any outstanding issues, the SCR will be formally closed in the change management system. All associated documentation will be archived.

### 3.7. Emergency Changes

**3.7.1. Definition:** An emergency change is an urgent software modification required to address critical issues that pose an immediate threat to product quality, patient safety, regulatory compliance, or significant operational disruption (e.g., system outage, critical data corruption).

**3.7.2. Initiation and Approval:** Emergency changes may be initiated by authorized personnel and require immediate verbal approval from the System Owner and a designated QA representative. Formal SCR documentation must be completed within 24 hours of the emergency change implementation.

**3.7.3. Implementation and Testing:** Emergency changes should be implemented with minimal testing necessary to ensure the immediate issue is resolved without introducing new critical problems. Full testing and validation, as per sections 3.4, must be completed as soon as feasible after the emergency deployment.

**3.7.4. Post-Implementation Review:** All emergency changes must undergo a thorough post-implementation review by the CCB to assess the effectiveness of the change, identify root causes, and implement preventive measures to avoid recurrence. This review must occur within 5 business days of the emergency change.

### 3.8. Software Retirement

**3.8.1. Justification for Retirement:** When a software system or module is no longer needed, becomes obsolete, or is replaced by a new system, a formal request for retirement must be initiated.

**3.8.2. Data Archiving and Migration:** Before retirement, all critical data associated with the software system must be archived according to data retention policies or migrated to a new system. Data integrity and accessibility must be ensured.

**3.8.3. System Decommissioning:** The software system will be formally decommissioned from the production environment. This includes removing software, databases, and associated hardware, and updating all relevant documentation.

**3.8.4. Documentation of Retirement:** The retirement process, including data archiving, migration, and decommissioning activities, must be thoroughly documented and approved by the System Owner and QA. The change management system will reflect the retired status of the software.



## 4. Documentation Requirements

Accurate and comprehensive documentation is paramount for maintaining control, traceability, and regulatory compliance throughout the software change control and version management lifecycle. All documentation must be readily accessible, legible, and maintained for the prescribed retention period.

**4.1. Software Change Request (SCR) Form:**
    *   All fields on the SCR form must be completed accurately and legibly.
    *   Must include unique SCR number, date, initiator details, software affected, type of change, detailed description, justification, urgency, and initial impact assessment.
    *   All approvals and decisions from the CCB must be recorded on the form or in an associated electronic system.

**4.2. Design Specifications:**
    *   Detailed technical design documents outlining the proposed changes, including system architecture diagrams, data flow diagrams, and module-level designs.
    *   Test plans, including unit, integration, system, and user acceptance test cases, expected results, and acceptance criteria.
    *   Rollback plans detailing the steps to revert to the previous software version in case of deployment failure.

**4.3. Version Control Records:**
    *   Comprehensive records within the version control system for all software code, configurations, and related documentation.
    *   Each version must be uniquely identified with a version number, date of change, author, and a clear description of modifications.
    *   Baselines for each approved release must be clearly defined and documented.

**4.4. Test and Validation Documentation:**
    *   Detailed test scripts and protocols for all testing phases (unit, integration, system, UAT).
    *   Documented test results, including actual results, deviations, and resolutions.
    *   Formal validation protocols (IQ, OQ, PQ) and their execution reports, demonstrating that the software meets its intended use and regulatory requirements.
    *   Traceability matrices linking requirements to design, code, and test cases.

**4.5. Deployment Records:**
    *   Deployment plans outlining the steps for deploying the software change to the production environment.
    *   Records of deployment execution, including date, time, personnel involved, and any issues encountered.
    *   Post-deployment verification results.

**4.6. Post-Implementation Review (PIR) Reports:**
    *   Reports summarizing the outcomes of the PIR, including whether the change achieved its objectives, any new issues, effectiveness of the process, and lessons learned.

**4.7. Training Records:**
    *   Documentation of all training conducted related to software changes, including attendance records, training materials, and assessment results.

**4.8. Audit Trails:**
    *   Electronic systems must maintain secure, computer-generated, time-stamped audit trails to record all actions related to software changes, including who performed what action, when, and why. These audit trails must be protected from unauthorized alteration.

**4.9. Retirement Documentation:**
    *   Records of software retirement, including justification, data archiving/migration details, and decommissioning activities.



## 5. Training Requirements

Effective training is crucial to ensure that all personnel involved in or affected by software changes are competent and understand their roles and responsibilities. Training programs must be developed and delivered to address the specific needs arising from software modifications.

**5.1. Identification of Training Needs:**
    *   For every software change, the IT Department, in conjunction with the System Owner and QA, will identify all personnel requiring training. This includes, but is not limited to, end-users, IT support staff, quality assurance personnel, and management.
    *   Training needs will be determined based on the nature and extent of the software change, its impact on existing processes, and the roles of the affected personnel.

**5.2. Development of Training Materials:**
    *   The Training Department, in collaboration with IT and subject matter experts, will develop comprehensive training materials. These materials may include:
        *   User manuals and updated SOPs.
        *   Quick reference guides.
        *   Presentations and interactive modules.
        *   Hands-on exercises and simulations.
    *   Training materials must be clear, concise, and reflect the actual changes implemented in the software.

**5.3. Delivery of Training:**
    *   Training will be delivered prior to the deployment of the software change to ensure personnel are proficient before using the modified system in a live environment.
    *   Training methods may include:
        *   Classroom-based instruction.
        *   Web-based training (WBT).
        *   One-on-one coaching.
        *   On-the-job training.
    *   For significant changes, mandatory training sessions will be conducted, and attendance will be recorded.

**5.4. Assessment of Training Effectiveness:**
    *   The effectiveness of training will be assessed through various methods, such as:
        *   Quizzes or written examinations.
        *   Practical demonstrations of proficiency.
        *   Observation of performance in the actual work environment.
    *   Personnel must demonstrate proficiency in using the modified software before being authorized to perform tasks related to the change.

**5.5. Training Records:**
    *   Comprehensive training records must be maintained by the Training Department and/or Human Resources. These records must include:
        *   Employee name and identification.
        *   Date of training.
        *   Training topic and materials used.
        *   Assessment results.
        *   Trainer's name.
    *   Training records are subject to review during internal and external audits to demonstrate compliance with regulatory requirements and internal procedures.



## 6. Quality Control Measures

Quality control measures are integral to ensuring that software changes are implemented without compromising the quality, integrity, and reliability of pharmaceutical manufacturing operations. These measures are designed to prevent errors, detect deviations, and ensure continuous compliance with regulatory standards.

**6.1. Adherence to Standard Operating Procedures (SOPs):**
    *   All personnel involved in software change control and version management must strictly adhere to this SOP and other relevant internal procedures.
    *   Regular audits will be conducted to verify compliance with established SOPs.

**6.2. Independent Review and Approval:**
    *   All critical documentation, including SCRs, design specifications, test plans, and validation reports, must undergo independent review and approval by qualified personnel (e.g., QA, System Owner) to ensure accuracy, completeness, and compliance.

**6.3. Segregation of Duties:**
    *   Clear segregation of duties must be maintained to prevent conflicts of interest and reduce the risk of unauthorized or erroneous changes. For example, personnel responsible for developing software changes should not be solely responsible for testing or approving those changes.

**6.4. Controlled Environments:**
    *   Software development, testing, and production environments must be physically and logically separated. Changes should be developed and tested in non-production environments before deployment to the live system.
    *   Access to these environments must be strictly controlled and monitored.

**6.5. Data Integrity Checks:**
    *   Regular data integrity checks will be performed on critical data processed or stored by the software systems. This includes verifying data accuracy, completeness, consistency, and traceability.
    *   Automated checks and manual reviews will be employed to identify and rectify any data corruption or inconsistencies resulting from software changes.

**6.6. System Monitoring and Performance Metrics:**
    *   Continuous monitoring of software system performance, stability, and security will be conducted. Key performance indicators (KPIs) and metrics will be established to track system health and identify potential issues early.
    *   Alerts and notifications will be configured to promptly inform relevant personnel of any deviations or critical events.

**6.7. Audit Trails and Electronic Records:**
    *   Electronic systems must generate secure, time-stamped audit trails that record all actions, changes, and access to the software and data. These audit trails are critical for forensic analysis, troubleshooting, and demonstrating compliance.
    *   Electronic records must be protected from unauthorized alteration or deletion and maintained in accordance with regulatory requirements (e.g., 21 CFR Part 11).

**6.8. Regular System Backups and Disaster Recovery:**
    *   Regular backups of all critical software systems and data will be performed and verified. Backup procedures will be documented and tested periodically to ensure data recoverability.
    *   A comprehensive disaster recovery plan will be in place and regularly tested to ensure business continuity in the event of a major system failure or disaster.

**6.9. Vendor Management:**
    *   For third-party software, a robust vendor management program will be in place. This includes qualifying vendors, establishing service level agreements (SLAs), and regularly assessing vendor performance and compliance with quality standards.
    *   Vendor-supplied software updates and patches will undergo the same change control process as internal modifications.



## 7. Safety Considerations

Safety is a paramount concern in pharmaceutical manufacturing, and software changes must be carefully evaluated to ensure they do not introduce new hazards or compromise existing safety measures. This section outlines the safety considerations to be addressed during the software change control process.

**7.1. Impact on Process Safety:**
    *   Before implementing any software change, a thorough assessment must be conducted to evaluate its potential impact on process safety. This includes reviewing how the software interacts with critical equipment, automated processes, and safety interlocks.
    *   Changes that could affect the safe operation of machinery, chemical handling, or environmental controls must be identified and mitigated.

**7.2. Data Integrity and Patient/Animal Safety:**
    *   Software changes must not compromise the integrity of data related to product formulation, batch records, quality control results, or adverse event reporting. Inaccurate or corrupted data can directly impact product quality and, consequently, patient or animal safety.
    *   Special attention must be paid to changes in software that directly control dosing, mixing, or other critical parameters in the manufacturing of large animal pharmaceuticals.

**7.3. Cybersecurity and System Vulnerabilities:**
    *   Software changes must not introduce new cybersecurity vulnerabilities that could lead to unauthorized access, data breaches, or system manipulation. Such breaches could compromise intellectual property, operational integrity, and ultimately, product safety.
    *   Regular security assessments and penetration testing should be considered for critical software systems, especially after significant changes.
    *   All software used in manufacturing operations must be protected against malware, viruses, and other cyber threats through appropriate security measures, including firewalls, antivirus software, and intrusion detection systems.

**7.4. Emergency Procedures and System Downtime:**
    *   Any software change that requires system downtime must be carefully planned to minimize disruption to critical safety systems or emergency response capabilities.
    *   Emergency procedures for system failures or unexpected behavior resulting from software changes must be clearly defined, communicated, and practiced.

**7.5. Training on Safety-Critical Software:**
    *   Personnel operating safety-critical software systems must receive specific training on the safe and correct use of the software, including any changes implemented. This training must cover potential hazards, emergency shutdown procedures, and data recovery processes.

**7.6. Compliance with Safety Regulations:**
    *   All software changes must comply with relevant occupational health and safety regulations, as well as industry-specific safety standards applicable to pharmaceutical manufacturing. This includes regulations related to machine guarding, lockout/tagout procedures, and hazardous material handling, where software interfaces are involved.



## 8. Regulatory Compliance References

Compliance with regulatory requirements is a cornerstone of pharmaceutical manufacturing. This SOP is developed in accordance with, and references, the following key regulatory guidelines and standards relevant to software change control and version management in large animal pharmaceutical operations:

**8.1. U.S. Food and Drug Administration (FDA):**
    *   **21 CFR Part 11 - Electronic Records; Electronic Signatures:** This regulation sets forth the criteria under which the FDA considers electronic records, electronic signatures, and handwritten signatures executed to electronic records to be trustworthy, reliable, and generally equivalent to paper records and handwritten signatures executed on paper. This is critical for audit trails, version control, and electronic approvals [1].
    *   **21 CFR Part 210 - Current Good Manufacturing Practice in Manufacturing, Processing, Packing, or Holding of Drugs; General:** This part outlines general CGMP regulations for drugs, emphasizing the need for proper controls to assure drug quality and safety [2].
    *   **21 CFR Part 211 - Current Good Manufacturing Practice for Finished Pharmaceuticals:** This part details specific CGMP requirements for finished pharmaceuticals, including controls over production and process controls, facilities, and equipment. Software used in these processes falls under these requirements [3].
    *   **Guidance for Industry: Computerized Systems Used in Clinical Investigations (May 2007):** While primarily for clinical investigations, the principles of validation, audit trails, and data integrity are broadly applicable to any computerized system used in regulated environments [4].
    *   **Guidance for Industry: General Principles of Software Validation (January 2002):** This comprehensive guidance provides the FDA's current thinking on the validation of software, whether used in the design, manufacture, or labeling of medical devices, or in other regulated areas. It emphasizes a lifecycle approach to validation [5].
    *   **FDA Regulation of Animal Drugs:** Specific regulations and guidances related to the approval, manufacturing, and post-market surveillance of animal drugs, ensuring their safety and efficacy for large animal use [6].

**8.2. U.S. Department of Agriculture (USDA):**
    *   **Animal and Plant Health Inspection Service (APHIS) Regulations:** While the FDA primarily regulates animal drugs, the USDA, through APHIS, has regulations concerning animal health and welfare, which may indirectly impact software systems used in facilities handling live animals or animal-derived products for pharmaceutical manufacturing. This includes regulations related to the importation, entry, and movement of animals [7].
    *   **9 CFR (Code of Federal Regulations) - Animals and Animal Products:** Various parts of 9 CFR cover regulations related to animal welfare, animal disease control, and veterinary biologics. Software systems that manage data related to animal health, tracking, or biological production must align with these regulations.

**8.3. Current Good Manufacturing Practices (cGMP):**
    *   **ICH Q7 - Good Manufacturing Practice Guide for Active Pharmaceutical Ingredients:** This guide provides guidance regarding GMP for the manufacturing of Active Pharmaceutical Ingredients (APIs). Software controlling API manufacturing processes should adhere to these principles [8].
    *   **ICH Q9 - Quality Risk Management:** This guideline provides a systematic approach to quality risk management, which is crucial for assessing and mitigating risks associated with software changes [9].
    *   **ICH Q10 - Pharmaceutical Quality System:** This guideline describes a model for an effective pharmaceutical quality system that is based on ICH Q7, Q8 (Pharmaceutical Development), and Q9. It emphasizes the importance of process performance and product quality monitoring, corrective and preventive actions (CAPA), and change management within a robust quality system [10].

**8.4. GAMP 5: A Risk-Based Approach to Compliant GxP Computerized Systems:**
    *   While not a regulation, GAMP 5 is an industry guide widely accepted and used for validating computerized systems in regulated environments. It provides practical guidance on applying a risk-based approach to GxP (Good Practice) computerized systems, including software development, testing, and change control [11].

---

**References:**

[1] U.S. Food and Drug Administration. (n.d.). *21 CFR Part 11 - Electronic Records; Electronic Signatures*. Retrieved from [https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=11](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=11)

[2] U.S. Food and Drug Administration. (n.d.). *21 CFR Part 210 - Current Good Manufacturing Practice in Manufacturing, Processing, Packing, or Holding of Drugs; General*. Retrieved from [https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=210](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=210)

[3] U.S. Food and Drug Administration. (n.d.). *21 CFR Part 211 - Current Good Manufacturing Practice for Finished Pharmaceuticals*. Retrieved from [https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=211](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=211)

[4] U.S. Food and Drug Administration. (2007, May). *Guidance for Industry: Computerized Systems Used in Clinical Investigations*. Retrieved from [https://www.fda.gov/regulatory-information/search-fda-guidance-documents/computerized-systems-used-clinical-investigations](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/computerized-systems-used-clinical-investigations)

[5] U.S. Food and Drug Administration. (2002, January). *Guidance for Industry: General Principles of Software Validation*. Retrieved from [https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-principles-software-validation](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-principles-software-validation)

[6] U.S. Food and Drug Administration. (n.d.). *FDA Regulation of Animal Drugs*. Retrieved from [https://www.fda.gov/animal-veterinary/resources-you/fda-regulation-animal-drugs](https://www.fda.gov/animal-veterinary/resources-you/fda-regulation-animal-drugs)

[7] U.S. Department of Agriculture, Animal and Plant Health Inspection Service. (n.d.). *Laws and Regulations*. Retrieved from [https://www.aphis.usda.gov/laws-regs](https://www.aphis.usda.gov/laws-regs)

[8] International Council for Harmonisation of Technical Requirements for Pharmaceuticals for Human Use. (n.d.). *ICH Q7 - Good Manufacturing Practice Guide for Active Pharmaceutical Ingredients*. Retrieved from [https://www.ich.org/page/quality-guidelines](https://www.ich.org/page/quality-guidelines)

[9] International Council for Harmonisation of Technical Requirements for Pharmaceuticals for Human Use. (n.d.). *ICH Q9 - Quality Risk Management*. Retrieved from [https://www.ich.org/page/quality-guidelines](https://www.ich.org/page/quality-guidelines)

[10] International Council for Harmonisation of Technical Requirements for Pharmaceuticals for Human Use. (n.d.). *ICH Q10 - Pharmaceutical Quality System*. Retrieved from [https://www.ich.org/page/quality-guidelines](https://www.ich.org/page/quality-guidelines)

[11] ISPE. (n.d.). *GAMP 5: A Risk-Based Approach to Compliant GxP Computerized Systems*. Retrieved from [https://ispe.org/publications/guidance-documents/gamp-5-second-edition](https://ispe.org/publications/guidance-documents/gamp-5-second-edition)




## 9. Approval Signatures

This Standard Operating Procedure (SOP) for Software Change Control and Version Management has been reviewed and approved by the undersigned. This approval signifies that the document is accurate, complete, and reflects the current practices and regulatory requirements for large animal pharmaceutical manufacturing operations. This SOP becomes effective on the date indicated below.

---

**Approved By:**

**System Owner:**

________________________________________

Name: [Print Name]

Title: [Print Title]

Date: [DD-MM-YYYY]

---

**Quality Assurance (QA) Head:**

________________________________________

Name: [Print Name]

Title: [Print Title]

Date: [DD-MM-YYYY]

---

**Information Technology (IT) Head:**

________________________________________

Name: [Print Name]

Title: [Print Title]

Date: [DD-MM-YYYY]

---

**Manufacturing Operations Head:**

________________________________________

Name: [Print Name]

Title: [Print Title]

Date: [DD-MM-YYYY]

---

**Change Control Board (CCB) Chairperson:**

________________________________________

Name: [Print Name]

Title: [Print Title]

Date: [DD-MM-YYYY]

---

**Regulatory Affairs Head:**

________________________________________

Name: [Print Name]

Title: [Print Title]

Date: [DD-MM-YYYY]

---

**Training Department Head:**

________________________________________

Name: [Print Name]

Title: [Print Title]

Date: [DD-MM-YYYY]

---

**Version History:**

| Version | Effective Date | Description of Change |
|---------|----------------|-----------------------|
| 1.0     | 2025-12-08     | Initial Release       |



