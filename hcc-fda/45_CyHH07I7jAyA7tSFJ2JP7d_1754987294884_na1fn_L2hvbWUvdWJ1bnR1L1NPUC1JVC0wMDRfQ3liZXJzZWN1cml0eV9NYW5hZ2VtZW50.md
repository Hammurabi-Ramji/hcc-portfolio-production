# Standard Operating Procedure (SOP)

## SOP-IT-004: Cybersecurity Management for Pharmaceutical Manufacturing

**Version:** 1.0
**Effective Date:** 2025-12-08
**Review Date:** 2026-12-08

**Category:** IT
**Compliance Areas:** FDA, USDA, cGMP

## 1.0 Purpose and Scope

### 1.1 Purpose
This Standard Operating Procedure (SOP) establishes the guidelines and procedures for managing cybersecurity risks within [Your Company Name]'s pharmaceutical manufacturing operations, specifically focusing on large animal pharmaceutical production. The purpose of this SOP is to protect the confidentiality, integrity, and availability of information systems and data critical to the manufacturing process, research and development, quality control, and regulatory compliance. It aims to prevent unauthorized access, use, disclosure, disruption, modification, or destruction of information and information systems.

### 1.2 Scope
This SOP applies to all personnel, systems, networks, applications, and data involved in the manufacturing, testing, storage, and distribution of large animal pharmaceutical products. This includes, but is not limited to, manufacturing execution systems (MES), laboratory information management systems (LIMS), enterprise resource planning (ERP) systems, process control systems (PCS), and all IT infrastructure supporting these operations. The scope encompasses both on-premise and cloud-based systems, as well as third-party vendors and service providers with access to [Your Company Name]'s information assets. This SOP is applicable across all phases of the product lifecycle, from raw material handling to finished product release, ensuring adherence to regulatory requirements such as FDA, USDA, and cGMP guidelines.

## 2.0 Responsibilities

### 2.1 Management
Management is responsible for providing the necessary resources, support, and oversight to ensure the effective implementation and maintenance of this Cybersecurity Management SOP. This includes fostering a culture of cybersecurity awareness, approving cybersecurity policies, and ensuring that all personnel understand their roles and responsibilities.

### 2.2 Cybersecurity Team
The Cybersecurity Team is responsible for the development, implementation, and continuous improvement of cybersecurity policies, procedures, and controls. This includes conducting risk assessments, managing security incidents, monitoring systems for vulnerabilities, and ensuring compliance with relevant regulations and internal policies.

### 2.3 IT Department
The IT Department is responsible for the technical implementation and maintenance of cybersecurity controls, including network security, system hardening, data backup and recovery, and access control mechanisms. They are also responsible for promptly addressing cybersecurity incidents and providing technical support to ensure the secure operation of all IT systems.

### 2.4 All Employees
All employees are responsible for adhering to the cybersecurity policies and procedures outlined in this SOP. This includes protecting sensitive information, reporting suspicious activities, and participating in required cybersecurity training. Employees must understand that cybersecurity is a shared responsibility and that their actions directly impact the security posture of the organization.

### 2.5 Third-Party Vendors and Contractors
Third-party vendors and contractors with access to [Your Company Name]'s systems or data are responsible for complying with the cybersecurity requirements specified in their contracts and this SOP. They must implement appropriate security controls to protect [Your Company Name]'s information assets and report any security incidents promptly.

## 3.0 Detailed Procedures

### 3.1 Risk Assessment and Management

#### 3.1.1 Identification of Assets
All information assets, including hardware, software, data, and networks, must be identified and inventoried. This inventory will include critical systems involved in large animal pharmaceutical manufacturing, such as automated production lines, quality control instruments, and data storage systems. Each asset will be assigned an owner and a criticality level based on its impact on business operations and regulatory compliance.

#### 3.1.2 Threat and Vulnerability Identification
Regular assessments will be conducted to identify potential threats (e.g., malware, phishing, insider threats) and vulnerabilities (e.g., unpatched software, misconfigured systems) that could compromise the confidentiality, integrity, or availability of information assets. Threat intelligence will be continuously monitored to stay abreast of emerging risks relevant to the pharmaceutical industry.

#### 3.1.3 Risk Analysis and Evaluation
Identified risks will be analyzed to determine their likelihood and potential impact. A risk matrix will be used to prioritize risks based on their severity. This analysis will consider the specific context of large animal pharmaceutical manufacturing, including the potential for disruption to animal health product supply chains and the impact on animal welfare.

#### 3.1.4 Risk Treatment
Appropriate controls will be implemented to mitigate identified risks. These controls may include technical measures (e.g., firewalls, intrusion detection systems), administrative measures (e.g., security policies, training), and physical measures (e.g., restricted access to data centers). The effectiveness of these controls will be regularly reviewed and updated.

### 3.2 Access Control

#### 3.2.1 User Access Management
Access to information systems and data will be granted based on the principle of least privilege, ensuring that users only have access to the resources necessary to perform their job functions. User accounts will be unique, and strong password policies will be enforced. Regular reviews of user access rights will be conducted to ensure they remain appropriate.

#### 3.2.2 Authentication and Authorization
Multi-factor authentication (MFA) will be implemented for all critical systems and remote access. Authorization mechanisms will ensure that users can only perform actions consistent with their assigned roles and responsibilities. This includes strict controls over access to manufacturing control systems and sensitive research data.

#### 3.2.3 Segregation of Duties
Duties will be segregated to prevent any single individual from having complete control over a critical process. For example, the individual responsible for configuring security settings will not be the same individual responsible for approving access requests.

### 3.3 Network Security

#### 3.3.1 Network Segmentation
Networks will be segmented to isolate critical manufacturing systems from general IT networks. This will limit the potential impact of a security breach and prevent unauthorized access to sensitive operational technology (OT) environments. Specific attention will be paid to the segregation of networks supporting animal housing and care systems from general business networks.

#### 3.3.2 Firewall Management
Firewalls will be configured to control network traffic between different segments and to and from external networks. Firewall rules will be regularly reviewed and updated to reflect changes in network architecture and security requirements.

#### 3.3.3 Intrusion Detection and Prevention Systems (IDPS)
IDPS will be deployed to monitor network traffic for malicious activity and to prevent intrusions. Alerts generated by the IDPS will be promptly investigated and addressed by the Cybersecurity Team.

### 3.4 Data Security

#### 3.4.1 Data Encryption
Sensitive data, both in transit and at rest, will be encrypted using industry-standard encryption protocols. This includes patient data, proprietary manufacturing processes, and research findings related to large animal pharmaceuticals.

#### 3.4.2 Data Backup and Recovery
Regular backups of critical data will be performed and stored securely off-site. A comprehensive data recovery plan will be in place and regularly tested to ensure business continuity in the event of a data loss incident.

#### 3.4.3 Data Loss Prevention (DLP)
DLP solutions will be implemented to prevent unauthorized transmission or exfiltration of sensitive data. This includes monitoring email, network traffic, and endpoint activities for potential data breaches.

### 3.5 System Hardening and Patch Management

#### 3.5.1 Secure Configuration
All systems, including servers, workstations, and network devices, will be configured securely according to established security baselines. Default passwords will be changed, unnecessary services will be disabled, and security patches will be applied promptly.

#### 3.5.2 Patch Management
A robust patch management process will be implemented to ensure that all systems and applications are regularly updated with the latest security patches. This is particularly critical for manufacturing systems to protect against known vulnerabilities that could be exploited by cyber attackers.

### 3.6 Security Incident Management

#### 3.6.1 Incident Response Plan
A comprehensive incident response plan will be developed and regularly tested. This plan will outline the procedures for identifying, containing, eradicating, recovering from, and learning from cybersecurity incidents. The plan will include specific protocols for incidents affecting manufacturing operations and animal welfare systems.

#### 3.6.2 Incident Reporting
All cybersecurity incidents, regardless of their severity, must be reported immediately to the Cybersecurity Team. A clear reporting mechanism will be established, and employees will be trained on how to identify and report incidents.

#### 3.6.3 Post-Incident Analysis
After each incident, a post-incident analysis will be conducted to identify the root cause, assess the effectiveness of the response, and implement corrective actions to prevent similar incidents in the future.

## 4.0 Documentation Requirements

All cybersecurity-related activities, configurations, and incidents must be thoroughly documented. This includes:

*   **Risk Assessment Reports:** Documenting identified risks, their analysis, and treatment plans.
*   **Security Policies and Procedures:** All approved cybersecurity policies and detailed operating procedures.
*   **System Configuration Documents:** Baselines and changes to system configurations.
*   **Incident Response Logs:** Detailed records of all security incidents, including detection, response, and resolution.
*   **Audit Logs:** Regular review and retention of system and application audit logs.
*   **Training Records:** Documentation of all cybersecurity training provided to employees.
*   **Vendor Security Assessments:** Records of security assessments performed on third-party vendors.

## 5.0 Training Requirements

### 5.1 Initial Training
All new employees will receive initial cybersecurity awareness training as part of their onboarding process. This training will cover basic cybersecurity principles, common threats, and their responsibilities under this SOP.

### 5.2 Recurring Training
Annual recurring cybersecurity awareness training will be provided to all employees. This training will be updated regularly to address new threats, vulnerabilities, and changes in policies or procedures. Specialized training will be provided to employees with specific cybersecurity responsibilities.

### 5.3 Phishing Simulations
Regular phishing simulations will be conducted to test employee awareness and their ability to identify and report phishing attempts. The results of these simulations will be used to tailor future training programs.

## 6.0 Quality Control Measures

### 6.1 Regular Audits and Reviews
Independent audits of cybersecurity controls will be conducted periodically to ensure their effectiveness and compliance with this SOP and regulatory requirements. These audits will include both internal and external assessments.

### 6.2 Performance Metrics
Key performance indicators (KPIs) and metrics will be established to measure the effectiveness of the cybersecurity program. These metrics may include the number of security incidents, time to detect and respond to incidents, and compliance with patch management timelines.

### 6.3 Continuous Improvement
The cybersecurity program will be continuously improved based on the results of risk assessments, audits, incident reviews, and changes in the threat landscape or regulatory requirements. Feedback from employees and external experts will also be incorporated.

## 7.0 Safety Considerations

Cybersecurity directly impacts the safety of pharmaceutical manufacturing operations, particularly in large animal production where automated systems and environmental controls are critical. A cybersecurity breach could lead to:

*   **Operational Disruptions:** Malicious attacks or system failures could halt production, impacting the availability of essential animal pharmaceuticals.
*   **Compromised Product Quality:** Unauthorized access or modification of manufacturing parameters could lead to deviations in product quality, potentially harming animals.
*   **Environmental Control Failures:** Cybersecurity incidents affecting HVAC or other environmental systems in animal housing could jeopardize animal welfare.
*   **Data Integrity Issues:** Compromised data could lead to incorrect dosing, mislabeling, or other errors with direct safety implications for animals.

Therefore, cybersecurity measures must be integrated with operational safety protocols to ensure the well-being of animals and the integrity of the pharmaceutical products.

## 8.0 Regulatory Compliance References

This SOP is developed in accordance with, and references, the following regulatory guidelines and standards:

*   **U.S. Food and Drug Administration (FDA):**
    *   **21 CFR Part 11:** Electronic Records; Electronic Signatures. Ensures the trustworthiness, reliability, and integrity of electronic records and signatures.
    *   **Guidance for Industry: Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions:** While primarily for medical devices, the principles of secure design, risk management, and post-market surveillance are highly relevant to pharmaceutical manufacturing systems, especially those with integrated control systems [1].
    *   **Pharmaceutical cGMPs for the 21st Century (cGMP):** Emphasizes a risk-based approach to quality management, which extends to cybersecurity as a critical component of data integrity and system reliability [2].

*   **U.S. Department of Agriculture (USDA):**
    *   Relevant USDA regulations pertaining to animal health and welfare, particularly concerning the security of systems that monitor and control animal environments, feed, and medication administration in large animal pharmaceutical manufacturing facilities. Specific USDA guidelines for cybersecurity are less explicit than FDA's for human pharmaceuticals, but general principles of data protection and operational integrity apply.

*   **Current Good Manufacturing Practices (cGMP):**
    *   **General cGMP Principles:** Require that manufacturing processes are controlled and validated to ensure product quality and safety. Cybersecurity is integral to maintaining the integrity of automated manufacturing processes and data used for batch release.
    *   **Data Integrity:** cGMP emphasizes the importance of data integrity (ALCOA - Attributable, Legible, Contemporaneous, Original, Accurate). Robust cybersecurity measures are essential to ensure that electronic data used in manufacturing and quality control is reliable and untampered.

## 9.0 Change Control Procedures

Any proposed changes to this Cybersecurity Management SOP must follow the established change control procedure. This includes:

*   **Change Request Submission:** All proposed changes must be documented and submitted through the formal change request process.
*   **Impact Assessment:** A thorough assessment of the potential impact of the proposed change on systems, processes, and regulatory compliance will be conducted.
*   **Approval:** Changes must be reviewed and approved by relevant stakeholders, including the Cybersecurity Team, IT Department, Quality Assurance, and Management.
*   **Implementation and Verification:** Approved changes will be implemented and verified to ensure they achieve the desired outcome without introducing new risks.
*   **Documentation Update:** This SOP and all related documents will be updated to reflect the approved changes, and all affected personnel will be notified and trained if necessary.

## 10.0 Approval Signatures

**Approved By:**

----------------------------------------
[Name of Head of IT/CIO]
Date:

----------------------------------------
[Name of Head of Quality Assurance]
Date:

----------------------------------------
[Name of Plant Manager/Head of Operations]
Date:

## 11.0 References

[1] U.S. Food and Drug Administration. (2023). *Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions*. [https://www.fda.gov/media/119933/download](https://www.fda.gov/media/119933/download)

[2] U.S. Food and Drug Administration. (2002). *Pharmaceutical cGMPs for the 21st Century: A Risk-Based Approach*.


