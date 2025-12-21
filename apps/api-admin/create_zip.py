import zipfile
import os

def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, path).replace('\\', '/')
            ziph.write(file_path, arcname)

with zipfile.ZipFile('api-admin-v2.14.3-cors-fix.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipdir('deploy', zipf)
print('Done')
