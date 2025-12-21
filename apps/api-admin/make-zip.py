import zipfile
import os

os.chdir('deploy')

with zipfile.ZipFile('../deploy-v2.17.8-chrome-yaml-fix.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        for file in files:
            filepath = os.path.join(root, file)
            # Convert Windows paths to Unix paths
            # Remove leading ./ but preserve .ebextensions dot
            arcname = filepath.replace(os.sep, '/')
            if arcname.startswith('./'):
                arcname = arcname[2:]
            zipf.write(filepath, arcname)

print('ZIP created successfully')
