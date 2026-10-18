# Review 062 — iac_terraform_scripts

Scope: `C:\IEDB\STRAW SaaS Generator\components\iac_terraform_scripts`. All direct files inspected: `main.tf` (25 lines), the only file. No applicable ancestor/root AGENTS.md was present in the checked project directories. Static review only.

## Inventory and promised behavior

`main.tf:1-25` declares an AWS provider, VPC, subnet, EC2 instance and public-IP output. This is an infrastructure shell, consistent with `docs/EXPANDED_SAAS_FRAMEWORK.md:12,35`, rather than an application deployment. The stronger production-ready claims in `docs/FINAL_VERIFICATION_REPORT.md:21,35-44` lack Terraform validation evidence; Rust workspace tests cannot validate this non-Cargo component.

Packaging exists: `core/config.json:33` registers the component, and `core/controller.py:80-95` copies selected files to `output/<template>/src/iac_terraform_scripts/`. Neither the controller's defaults nor `templates/bundle_templates.py` mappings select it. Optional selection is appropriate; generated consumers need explicit working-directory and deployment instructions.

## Findings and concrete patch targets

- **P1 — advertised public endpoint is not provisioned.** `main.tf:10-24` names a public subnet and outputs `public_ip`, but contains no internet gateway, default internet route/route association, or public-IP assignment. It also supplies no application ingress security group. This configuration does not establish an internet-accessible application endpoint. Patch `main.tf` to choose and implement either a documented private deployment or a complete public network path with narrowly scoped application ingress; make the output match that topology.
- **P2 — app-server resource never deploys the application.** `main.tf:16-20` launches an instance without bootstrap, artifact delivery or service configuration. Add an explicit application deployment contract (artifact/version input, bootstrap and health endpoint) if deployment is required, or add a component README clearly identifying this as VM provisioning only. This is a requirement gap relative to blanket readiness claims, not proof that the shell was intended to contain an app.
- **P2 — portability and reproducibility gaps.** `main.tf:1-2,6,12,17-18` hardcode region, address ranges, AMI and instance type; there is no Terraform/required-provider version declaration. Add validated inputs and supported version constraints, with a reviewed region-compatible AMI input or controlled discovery policy. The existing AMI's availability was not checked and is not asserted invalid.

## Dependencies and acceptance

Requires Terraform, a compatible AWS provider, AWS credentials and chosen AWS region/image; none were invoked. Add local usage/state-handling documentation and reconcile readiness wording. Future checks: formatting and validation with pinned provider tooling; inspect a reviewed plan for routing, address assignment and ingress; separately verify bootstrap and health in an authorized test environment. Confirm an explicitly selected generated bundle contains the same files and documented execution path.

- [ ] Decide private/public topology and implement matching resources/output.
- [ ] Document shell scope or implement application bootstrap and health contract.
- [ ] Add validated deployment inputs and Terraform/provider constraints.
- [ ] Add usage guidance and evidence-based readiness/acceptance documentation.

Confidence: high on inventory, packaging and missing declarations; cloud availability, provider validation and live behavior remain unverified. No source changes, Terraform commands, provider calls, installs or deployment were performed.
