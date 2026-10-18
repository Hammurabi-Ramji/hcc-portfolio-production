from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Iterable


DEFAULT_CONFIG_PATH = Path(__file__).with_name("config.json")


class SaaSController:
    def __init__(self, config_path: str | Path | None = None):
        self.config_path = (
            Path(config_path)
            if config_path
            else DEFAULT_CONFIG_PATH
        )

        with self.config_path.open("r", encoding="utf-8") as file:
            self.config = json.load(file)

        configured_base_path = self.config.get("base_path")
        default_base_path = self.config_path.parent.parent

        if configured_base_path:
            candidate_base_path = Path(configured_base_path)
            self.base_path = (
                candidate_base_path
                if candidate_base_path.exists()
                else default_base_path
            )
        else:
            self.base_path = default_base_path

    def list_templates(self) -> list[str]:
        return list(self.config["templates"])

    def list_components(self) -> list[str]:
        return list(self.config["available_components"])

    def generate_saas(
        self,
        template_name: str,
        active_components: Iterable[str] | None = None,
    ) -> Path:
        if template_name not in self.list_templates():
            available_templates = ", ".join(self.list_templates())
            raise ValueError(
                f"Template {template_name} not found. "
                f"Available templates: {available_templates}"
            )

        print(f"Generating SaaS for template: {template_name}")

        if active_components is not None:
            requested_components = list(active_components)
        else:
            requested_components = self.get_template_defaults(template_name)

        requested_components = list(dict.fromkeys(requested_components))

        available_components = self.list_components()
        invalid_components = [
            component
            for component in requested_components
            if component not in available_components
        ]
        valid_components = [
            component
            for component in requested_components
            if component in available_components
        ]

        if invalid_components:
            invalid_label = ", ".join(invalid_components)
            print(f"  [!] Skipping unknown components: {invalid_label}")

        output_dir = self.base_path / "output" / template_name
        if output_dir.exists():
            try:
                shutil.rmtree(output_dir)
            except OSError as error:
                print(f"  [!] Warning: Could not clean {output_dir}: {error}")

        src_root = output_dir / "src"
        src_root.mkdir(parents=True, exist_ok=True)

        for component in valid_components:
            src = self.base_path / "components" / component
            dst = src_root / component

            if src.exists() and any(src.iterdir()):
                shutil.copytree(src, dst, dirs_exist_ok=True)
                print(f"  [+] Integrated component: {component}")
            else:
                dst.mkdir(parents=True, exist_ok=True)
                placeholder_title = component.replace("_", " ").title()
                placeholder_text = (
                    f"# {placeholder_title}\n"
                    "Placeholder for component implementation."
                )
                (dst / "README.md").write_text(
                    placeholder_text,
                    encoding="utf-8",
                )
                print(f"  [-] Placeholder created for: {component}")

        manifest = {
            "saas_name": template_name.replace("_", " ").title(),
            "active_components": valid_components,
            "missing_components": invalid_components,
            "status": "ready_to_build",
            "features_requested": len(requested_components),
            "features_included": len(valid_components),
        }
        manifest_path = output_dir / "manifest.json"
        manifest_path.write_text(
            json.dumps(manifest, indent=2),
            encoding="utf-8",
        )

        print(f"Generation complete: {output_dir}")
        return output_dir

    def generate_all(self) -> list[Path]:
        generated_paths: list[Path] = []

        for template_name in self.list_templates():
            generated_paths.append(self.generate_saas(template_name))

        return generated_paths

    def get_template_defaults(self, template_name: str) -> list[str]:
        base_stack = [
            "auth_system",
            "database_sqlite",
            "api_layer_axum",
            "frontend_svelte",
            "desktop_shell_tauri",
            "user_management",
            "file_storage_local",
            "landing_page_marketing",
            "admin_dashboard_ui",
            "cicd_github_actions",
            "secrets_management_vault",
            "error_tracking_sentry",
            "uptime_monitor",
        ]

        mapping = {
            "healthcare_saas": base_stack + [
                "security_zero_trust",
                "ai_engine_ollama",
                "reporting_engine",
                "object_storage_s3",
                "timeseries_db_influx",
                "waf_security_layer",
                "monitoring_prometheus",
                "log_aggregation_loki",
                "support_portal_internal",
            ],
            "finance_saas": base_stack + [
                "billing_stripe",
                "dashboard_analytics",
                "security_zero_trust",
                "reporting_engine",
                "tax_calculation_service",
                "webhook_system",
                "background_job_processor",
                "caching_layer_redis",
                "read_replicas_manager",
            ],
            "ecommerce_saas": base_stack + [
                "billing_stripe",
                "search_engine_local",
                "notification_system",
                "tax_calculation_service",
                "webhook_system",
                "object_storage_s3",
                "user_analytics_posthog",
                "crm_integration_hub",
                "mobile_app_shell",
            ],
            "marketing_saas": base_stack + [
                "dashboard_analytics",
                "ai_engine_ollama",
                "notification_system",
                "reporting_engine",
                "user_analytics_posthog",
                "email_template_system",
                "crm_integration_hub",
                "data_pipeline_etl",
                "background_job_processor",
            ],
            "education_saas": base_stack + [
                "notification_system",
                "reporting_engine",
                "object_storage_s3",
                "email_template_system",
                "mobile_app_shell",
                "support_portal_internal",
                "component_library_ui",
            ],
            "real_estate_saas": base_stack + [
                "search_engine_local",
                "dashboard_analytics",
                "notification_system",
                "object_storage_s3",
                "mobile_app_shell",
                "crm_integration_hub",
                "webhook_system",
            ],
            "legal_saas": base_stack + [
                "security_zero_trust",
                "reporting_engine",
                "ai_engine_ollama",
                "object_storage_s3",
                "secrets_management_vault",
                "support_portal_internal",
                "data_pipeline_etl",
            ],
            "logistics_saas": base_stack + [
                "dashboard_analytics",
                "notification_system",
                "search_engine_local",
                "timeseries_db_influx",
                "background_job_processor",
                "webhook_system",
                "api_gateway_proxy",
                "microservices_orchestrator",
            ],
            "creative_agency_saas": base_stack + [
                "billing_stripe",
                "notification_system",
                "object_storage_s3",
                "email_template_system",
                "component_library_ui",
                "support_portal_internal",
                "user_analytics_posthog",
            ],
        }
        return mapping.get(template_name, base_stack)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Generate SaaS starter bundles from the "
            "HCC STRAW SaaS generator."
        ),
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--config", help="Path to the generator config file.")
    parser.add_argument("--template", help="Generate a single named template.")
    parser.add_argument(
        "--components",
        nargs="+",
        help=(
            "Override the component list for --template with a "
            "space-separated set of component names."
        ),
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Generate every configured template.",
    )
    parser.add_argument(
        "--list-templates",
        action="store_true",
        help="Print the available template names and exit.",
    )
    parser.add_argument(
        "--list-components",
        action="store_true",
        help="Print the available component names and exit.",
    )
    return parser


def print_collection(title: str, items: Iterable[str]) -> None:
    print(title)
    for item in items:
        print(f"  - {item}")


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.all and args.template:
        parser.error("Choose either --template or --all, not both.")

    if args.components and not args.template:
        parser.error("--components can only be used together with --template.")

    controller = SaaSController(args.config)

    if args.list_templates:
        print_collection("Available templates:", controller.list_templates())
        return

    if args.list_components:
        print_collection("Available components:", controller.list_components())
        return

    if args.all:
        generated_paths = controller.generate_all()
        print(f"Generated {len(generated_paths)} template bundles.")
        return

    if args.template:
        controller.generate_saas(args.template, args.components)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
