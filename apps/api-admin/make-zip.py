import zipfile
import os

os.chdir('deploy')

with zipfile.ZipFile('../deploy-v2.10.0-commercial-portal.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        for file in files:
            filepath = os.path.join(root, file)
            # Convert Windows paths to Unix paths
            arcname = filepath.replace(os.sep, '/').lstrip('./')
            zipf.write(filepath, arcname)

print('ZIP created successfully')
