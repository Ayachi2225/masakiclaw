# API Key Protection Retains the Existing Local Threat Model

The Tampermonkey edition will retain the Chrome edition's API Key choices: do not save, save encrypted behind a six-character ASCII password, or save plaintext after explicit opt-in. This protection is intended to prevent casual disclosure from local script storage, not to defend against an attacker who already controls the browser profile or operating-system account; changing the password format would add migration and UX differences without addressing that stronger threat.
