#!/usr/bin/env node
/**
 * 7X Circle Authenticator — publish the signed APK to a Gitee Release.
 *
 * Required env:
 *   GITEE_TOKEN        Gitee personal access token (repo/release scope)
 *   GITHUB_REF_NAME    tag name, e.g. v1.4.0
 * Optional env:
 *   GITEE_OWNER        default: weinotes
 *   GITEE_REPO         default: 7xcircle-authenticator
 *   GITEE_APK          default: android/app/build/outputs/apk/release/app-release.apk
 *   GITEE_RELEASE_BODY release description
 *   GITEE_DRY_RUN      "1" prints the plan without writing to Gitee
 *
 * The script is idempotent: if the release or the asset already exists it
 * prints a skip message instead of uploading a duplicate.
 */

import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'

const api = 'https://gitee.com/api/v5'
const token = process.env.GITEE_TOKEN
const owner = process.env.GITEE_OWNER ?? 'weinotes'
const repo = process.env.GITEE_REPO ?? '7xcircle-authenticator'
const tag = process.env.GITHUB_REF_NAME ?? process.argv[2]
const apkPath = process.env.GITEE_APK ?? 'android/app/build/outputs/apk/release/app-release.apk'
const dryRun = process.env.GITEE_DRY_RUN === '1'

function log(message = '') {
  process.stdout.write(`${message}\n`)
}

if (!token) {
  console.error('GITEE_TOKEN is required')
  process.exit(1)
}
if (!tag) {
  console.error('GITHUB_REF_NAME (tag) is required')
  process.exit(1)
}

const releaseBody =
  process.env.GITEE_RELEASE_BODY ??
  [
    `## 7X Circle Authenticator ${tag}`,
    '',
    '- `app-release.apk` — 正式签名版本，可直接安装。',
    `- 源码与完整变更：https://github.com/weinotes/7xcircle-authenticator/releases/tag/${tag}`,
    '',
    '所有数据仅保存在本机，应用不发起网络请求。',
  ].join('\n')

async function apiFetch(path, init = {}) {
  const response = await fetch(`${api}${path}`, init)
  const text = await response.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  return { response, json }
}

async function getRelease() {
  const { response, json } = await apiFetch(
    `/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`,
  )
  if (response.ok) return json
  if (response.status === 404) return null
  throw new Error(`Gitee release lookup failed: ${response.status} ${JSON.stringify(json)}`)
}

async function createRelease() {
  const form = new FormData()
  form.append('access_token', token)
  form.append('tag_name', tag)
  form.append('name', `7X Circle Authenticator ${tag}`)
  form.append('body', releaseBody)
  form.append('target_commitish', process.env.GITHUB_SHA ?? tag)
  form.append('prerelease', 'false')

  const { response, json } = await apiFetch(`/repos/${owner}/${repo}/releases`, {
    method: 'POST',
    body: form,
  })
  if (!response.ok) {
    throw new Error(`Gitee release creation failed: ${response.status} ${JSON.stringify(json)}`)
  }
  return json
}

function findAsset(release, name) {
  return (release.assets ?? []).find((asset) => asset.name === name)
}

async function uploadAsset(release, filePath) {
  const file = readFileSync(filePath)
  const form = new FormData()
  form.append('access_token', token)
  form.append(
    'file',
    new Blob([file], { type: 'application/vnd.android.package-archive' }),
    basename(filePath),
  )

  const { response, json } = await apiFetch(
    `/repos/${owner}/${repo}/releases/${release.id}/attach_files`,
    { method: 'POST', body: form },
  )
  if (!response.ok) {
    throw new Error(`Gitee asset upload failed: ${response.status} ${JSON.stringify(json)}`)
  }
  return json
}

const assetName = basename(apkPath)
log(`Gitee target: ${owner}/${repo} @ ${tag}`)

let release = await getRelease()
if (!release) {
  if (dryRun) {
    log(`[dry-run] would create Gitee release ${tag}`)
    log(`[dry-run] would upload ${assetName}`)
    process.exit(0)
  }
  release = await createRelease()
  log(`created Gitee release ${tag} (id ${release.id})`)
} else {
  log(`Gitee release ${tag} already exists (id ${release.id})`)
}

const existing = findAsset(release, assetName)
if (existing) {
  log(`asset ${assetName} already attached, skipping upload`)
  process.exit(0)
}

if (!existsSync(apkPath)) {
  throw new Error(`APK not found: ${apkPath}`)
}

if (dryRun) {
  log(`[dry-run] would upload ${assetName}`)
  process.exit(0)
}

const uploaded = await uploadAsset(release, apkPath)
log(`uploaded ${assetName} (id ${uploaded.id ?? 'unknown'})`)
