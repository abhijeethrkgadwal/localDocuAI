# Security Policy

This policy follows common open-source practice (including GitHub’s private
vulnerability reporting model) and LocalDocu’s privacy-first product intent.

## Supported versions

| Version / surface | Security updates |
| ----------------- | ---------------- |
| Current `main` branch (web app + packages) | Supported |
| Tagged releases (when published) | Supported until superseded by a newer release |
| Experimental / unreleased feature branches | Best-effort only |
| Third-party forks | Not supported by this project |

Security fixes are prioritized for the current `main` branch of LocalDocu.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

### Preferred: GitHub private advisory

If enabled for this repository, use GitHub Security Advisories:

[Report a vulnerability](https://github.com/abhijeethrkgadwal/localDocuAI/security/advisories/new)

### Alternative: private maintainer contact

Contact the maintainer privately via GitHub:

* Maintainer: [Abhijeeth Gadwal](https://github.com/abhijeethrkgadwal)
* Portfolio / contact: [davnix.com/abhijeeth-gadwal](https://www.davnix.com/abhijeeth-gadwal)

### What to include

Please provide as much of the following as you can:

1. A clear description of the issue and potential impact
2. Affected component (for example `apps/web`, `@localdoc/pdf`, filesystem adapter, PWA/service worker)
3. Steps to reproduce, or a minimal proof of concept
4. LocalDocu version, commit SHA, browser/OS if relevant
5. Whether document contents, credentials, or other sensitive data could leave the device unexpectedly
6. Any suggested fix or mitigation
7. Whether you plan public disclosure and on what timeline

### Our response process

We aim to:

1. **Acknowledge** receipt within **7 days** when possible
2. **Assess** severity and affected surfaces
3. **Remediate** or mitigate on a timeline appropriate to impact
4. **Coordinate disclosure** before any public write-up, when mutually agreed

We may request more information and will credit reporters who wish to be named,
unless anonymity is requested.

## Threat model notes (LocalDocu)

LocalDocu is designed so **document bytes stay on the user’s device** for current
web workflows. Reports in these areas are especially important:

### High priority

* Unexpected **network transmission of document contents** (PDF/DOC/DOCX bytes or extracted text) to any remote endpoint
* Supply-chain or build compromises that inject document-exfiltrating code
* Cross-site scripting, path traversal, or prototype pollution that can read session document bytes or force downloads/uploads
* Service worker / PWA cache poisoning that serves malicious application code
* Bypass of permission prompts that grants broader filesystem access than the user intended

### Also in scope

* Local denial-of-service that reliably crashes the tab/app on common documents
* Incorrect handling of encrypted/corrupt PDFs that could be abused
* Dependency vulnerabilities with a practical exploit path in LocalDocu

### Out of scope (unless they enable the above)

* Social engineering of end users outside the product
* Issues that require a compromised machine or malicious browser extension already present
* Theoretical AI “jailbreaks” for features that are **not shipped** yet
* Feature requests framed as security issues (use feature requests instead)

## Future surfaces: Desktop and LocalDocu AI

Planned capabilities must preserve the same privacy bar:

* **Desktop app** — stronger local capacity; same local-first principles as the web app
* **LocalDocu AI** (desktop) — intended to use an **open-weight, on-device** model that plans work from **user intent + document metadata**, then drives validated LocalDocu document-management commands. Document **contents** must not be sent to a remote AI for processing unless the user **explicitly** enables a clearly disclosed mode

Security reports that would cause LocalDocu AI or desktop builds to send document contents off-device without informed consent are treated as **high priority**.

## Safe harbor

We will not pursue legal action against researchers who:

* Make a good-faith effort to follow this policy
* Avoid privacy violations, data destruction, and service disruption beyond what is needed to demonstrate the issue
* Do not access or exfiltrate other users’ data
* Give us a reasonable time to remediate before public disclosure

## Related documents

* [Privacy model](docs/privacy/privacy-model.md)
* [Code of Conduct](CODE_OF_CONDUCT.md)
* [Contributing](CONTRIBUTING.md)
