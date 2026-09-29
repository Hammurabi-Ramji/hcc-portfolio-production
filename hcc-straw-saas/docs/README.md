# hcc-straw-saas: Modular SaaS Generation Framework

This framework provides a modular approach to generating SaaS applications, leveraging the STRAW Stack (Svelte + Tauri + Rust + Axum + WASM) for desktop-first, sovereign applications. It allows for the creation of complex SaaS solutions by selecting and bundling various components into industry-specific templates.

## Framework Structure

The `hcc-straw-saas` directory is organized as follows:

```
hcc-straw-saas/
├── core/                     # Core framework logic and configuration
│   ├── config.json           # Global configuration for components and templates
│   └── controller.py         # Python script to generate SaaS instances
├── components/               # Individual, modular SaaS components (Rust, Svelte, etc.)
│   ├── auth_system/          # User authentication and authorization
│   ├── billing_stripe/       # Stripe integration for billing and subscriptions
│   ├── dashboard_analytics/  # Data visualization and analytics dashboard
│   ├── ai_engine_ollama/     # Local AI model integration (e.g., Ollama)
│   ├── database_sqlite/      # Local SQLite database management
│   ├── api_layer_axum/       # Rust Axum-based API layer
│   ├── frontend_svelte/      # Svelte frontend components
│   ├── desktop_shell_tauri/  # Tauri desktop shell integration
│   ├── notification_system/  # Email, SMS, Push notification capabilities
│   ├── user_management/      # User profile and role management
│   ├── file_storage_local/   # Local file storage and management
│   ├── reporting_engine/     # Report generation (PDF, CSV)
│   ├── search_engine_local/  # Local full-text search capabilities
│   └── security_zero_trust/  # Zero-trust security policies and enforcement
├── templates/                # Pre-configured industry-specific SaaS templates
│   ├── bundle_templates.py   # Script to bundle components into templates
│   ├── healthcare_saas/      # Example: Healthcare SaaS template
│   ├── finance_saas/         # Example: Finance SaaS template
│   └── ... (7 more industry templates)
└── docs/                     # Documentation for the framework
    └── README.md             # This document
```

## Core Components

Each component is designed to be modular and can be toggled on or off during the SaaS generation process. Below is a list of available components and their primary functions:

| Component Name | Description | Primary Technologies |
| :------------- | :---------- | :------------------- |
| `auth_system` | Handles user authentication, authorization, and JWT token management. | Rust (jsonwebtoken, chrono) |
| `billing_stripe` | Integrates with Stripe for subscription management and payment processing. | Rust (mock Stripe API) |
| `dashboard_analytics` | Provides functionalities for tracking and summarizing application metrics. | Rust (HashMap) |
| `ai_engine_ollama` | Enables local AI model inference and interaction via Ollama. | Rust (reqwest) |
| `database_sqlite` | Manages local data persistence using SQLite. | Rust (rusqlite) |
| `api_layer_axum` | Provides a robust and asynchronous API layer for backend services. | Rust (Axum, Tokio) |
| `frontend_svelte` | Core Svelte components for building interactive user interfaces. | Svelte |
| `desktop_shell_tauri` | Integrates the application with the Tauri desktop environment. | Rust (Tauri) |
| `notification_system` | Manages sending various types of notifications (Email, SMS, Push). | Rust |
| `user_management` | Handles user profiles, roles, and status updates. | Rust |
| `file_storage_local` | Provides local file system operations for storing and retrieving data. | Rust (std::fs) |
| `reporting_engine` | Generates reports in various formats (e.g., PDF, CSV). | Rust |
| `search_engine_local` | Implements local full-text search capabilities. | Rust |
| `security_zero_trust` | Enforces zero-trust access policies and MFA requirements. | Rust |

## How to Generate a SaaS Application

To generate a customized SaaS application, you will use the `controller.py` script located in the `core/` directory.

### 1. Using Pre-defined Templates

The framework comes with 9 pre-defined industry templates. To generate a SaaS application based on a template with its default components, run the `controller.py` script with the desired template name:

```bash
python C:\hcc-straw\hcc-straw-saas\core\controller.py
```

By default, the `controller.py` script will generate a `healthcare_saas` application. To generate a different template, you would modify the `if __name__ == "__main__":` block in `controller.py` or create a wrapper script.

**Example (modifying `controller.py` to generate `finance_saas`):**

```python
if __name__ == "__main__":
    controller = SaaSController()
    controller.generate_saas("finance_saas") # Change to your desired template
```

### 2. Customizing Components

You can also specify a custom list of active components to include in your SaaS application. This allows for fine-grained control over the features of your generated service.

**Example (generating a custom SaaS with specific components):**

```python
if __name__ == "__main__":
    controller = SaaSController()
    custom_components = [
        "auth_system",
        "frontend_svelte",
        "database_sqlite",
        "file_storage_local",
        "notification_system"
    ]
    controller.generate_saas("my_custom_saas", active_components=custom_components)
```

*Note: When using `active_components`, the `template_name` will still be used for the output directory name, but the component selection will be overridden by `active_components`.*

## Generated Templates

After running the `bundle_templates.py` script, the `templates/` directory will contain the following industry-specific SaaS bundles:

*   `healthcare_saas/`
*   `finance_saas/`
*   `ecommerce_saas/`
*   `marketing_saas/`
*   `education_saas/`
*   `real_estate_saas/`
*   `legal_saas/`
*   `logistics_saas/`
*   `creative_agency_saas/`

Each template directory contains the Rust source code for its bundled components and a `manifest.json` file detailing the template's configuration.

## Development and Customization

Developers can further customize the generated SaaS applications by:

*   **Modifying Components**: Edit the Rust (`.rs`) and Svelte (`.svelte`) files within the `components/` directory to alter existing functionalities.
*   **Adding New Components**: Create new directories under `components/` with new Rust or Svelte code and update `core/config.json` to make them available.
*   **Creating New Templates**: Define new component combinations in the `get_template_defaults` method within `core/controller.py` or `templates/bundle_templates.py`.

This modular framework aims to accelerate the development of desktop-first SaaS applications by providing a robust, customizable, and sovereign foundation.
