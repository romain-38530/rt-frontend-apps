#!/usr/bin/env python3
import boto3
import json

# Apps à mettre à jour
apps = {
    'd31p7m90ewg4xm': 'web-logistician',
    'd1tb834u144p4r': 'web-transporter',
    'd3b6p09ihn5w7r': 'web-recipient',
    'dzvo8973zaqb': 'web-supplier',
    'd3hz3xvddrl94o': 'web-forwarder',
    'dbg6okncuyyiw': 'web-industry'
}

buildspec_template = """version: 1
applications:
  - appRoot: apps/{app_name}
    frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm@8.15.4
            - cd ../..
            - echo "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" >> .npmrc
            - pnpm install
            - cd packages/contracts && pnpm run build && cd ../..
            - cd packages/utils && pnpm run build && cd ../..
            - cd packages/ui-components && pnpm run build && cd ../..
            - cd apps/{app_name}
        build:
          commands:
            - pnpm run build
            - rm -rf .next
            - echo '{{"version":1,"config":{{}},"appDir":"","files":[],"ignore":[]}}' > out/required-server-files.json
      artifacts:
        baseDirectory: out
        files:
          - '**/*'
      cache:
        paths:
          - ../../node_modules/**/*
          - .next/cache/**/*
          - ../../.pnpm-store/**/*"""

client = boto3.client('amplify', region_name='eu-central-1')

for app_id, app_name in apps.items():
    buildspec = buildspec_template.format(app_name=app_name)
    print(f"Updating {app_name} ({app_id})...")

    try:
        response = client.update_app(
            appId=app_id,
            buildSpec=buildspec
        )
        print(f"✅ {app_name} updated successfully")
    except Exception as e:
        print(f"❌ {app_name} failed: {e}")

print("\n✨ All buildSpecs updated!")
