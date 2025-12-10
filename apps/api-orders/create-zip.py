import zipfile
import os

with zipfile.ZipFile('v2.10.0-s3-documents.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('deploy'):
        for f in files:
            path = os.path.join(root, f)
            arc = path.replace('deploy/', '', 1).replace('deploy\\', '', 1)
            z.write(path, arc)

print('ZIP created successfully')
