#!/bin/bash
echo "Starting deployment at $(date)" > deploy.log
git version >> deploy.log 2>&1
git branch -a >> deploy.log 2>&1
git add . >> deploy.log 2>&1
git commit -m "fix: attendance logic and production sync" >> deploy.log 2>&1
git push origin dev >> deploy.log 2>&1
git push origin dev:main --force >> deploy.log 2>&1
git checkout dev >> deploy.log 2>&1
echo "Finished deployment at $(date)" >> deploy.log
