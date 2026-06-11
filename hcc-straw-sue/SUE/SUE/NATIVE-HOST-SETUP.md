# SUE Native Host Setup

## Files added

- native-host/host.py
- native-host/install_host.py
- config/host-manifest.json

## Quick setup (Windows)

1. Set your extension ID in environment:
   - `setx SUE_EXTENSION_ID <your_extension_id>`
2. Generate a manifest with absolute path:
   - `python native-host/install_host.py`
3. Register host manifest in registry:
   - Key: `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.hammurabi.sue.nativehost`
   - Default value: absolute path to `config/host-manifest.generated.json`
4. Reload the extension in browser.

## Supported native actions

- GET_SYSTEM_INFO
- LIST_DIRECTORY
- READ_FILE
- WRITE_FILE
- EXECUTE_PROGRAM (whitelisted)

## Security defaults

- `EXECUTE_PROGRAM` only allows: python, python3, node, npm, git.
- `shell=False` is enforced.
