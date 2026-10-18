import os
import json
import shutil

class TemplateBundler:
    def __init__(self, base_path="C:\\hcc-straw\\hcc-straw-saas"):
        self.base_path = base_path
        self.components_path = os.path.join(base_path, "components")
        self.templates_path = os.path.join(base_path, "templates")
        
        with open(os.path.join(base_path, "core", "config.json"), 'r') as f:
            self.config = json.load(f)

    def bundle_all(self):
        for template in self.config['templates']:
            self.create_template_bundle(template)

    def create_template_bundle(self, template_name):
        print(f"Bundling template: {template_name}")
        template_dir = os.path.join(self.templates_path, template_name)
        if os.path.exists(template_dir):
            shutil.rmtree(template_dir)
        os.makedirs(template_dir)
        
        # Get industry specific components
        components = self.get_industry_components(template_name)
        
        # Copy components to template bundle
        for comp in components:
            src = os.path.join(self.components_path, comp)
            dst = os.path.join(template_dir, comp)
            if os.path.exists(src):
                shutil.copytree(src, dst)
        
        # Create template specific manifest
        manifest = {
            "template_id": template_name,
            "industry": template_name.split('_')[0].capitalize(),
            "bundled_components": components,
            "design_spec": "Industry Standard Dark Mode"
        }
        with open(os.path.join(template_dir, "manifest.json"), 'w') as f:
            json.dump(manifest, f, indent=2)

    def get_industry_components(self, template_name):
        mapping = {
            "healthcare_saas": ["auth_system", "database_sqlite", "security_zero_trust", "user_management", "ai_engine_ollama", "reporting_engine"],
            "finance_saas": ["auth_system", "billing_stripe", "dashboard_analytics", "security_zero_trust", "reporting_engine", "database_sqlite"],
            "ecommerce_saas": ["auth_system", "billing_stripe", "frontend_svelte", "file_storage_local", "search_engine_local", "notification_system"],
            "marketing_saas": ["dashboard_analytics", "ai_engine_ollama", "notification_system", "reporting_engine", "api_layer_axum"],
            "education_saas": ["auth_system", "user_management", "file_storage_local", "frontend_svelte", "database_sqlite"],
            "real_estate_saas": ["search_engine_local", "file_storage_local", "dashboard_analytics", "notification_system", "api_layer_axum"],
            "legal_saas": ["security_zero_trust", "reporting_engine", "file_storage_local", "auth_system", "database_sqlite"],
            "logistics_saas": ["dashboard_analytics", "notification_system", "api_layer_axum", "database_sqlite", "search_engine_local"],
            "creative_agency_saas": ["frontend_svelte", "file_storage_local", "billing_stripe", "user_management", "notification_system"]
        }
        return mapping.get(template_name, [])

if __name__ == "__main__":
    bundler = TemplateBundler()
    bundler.bundle_all()
