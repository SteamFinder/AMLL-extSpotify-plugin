# extSpotify Plugin for AMLL Player

## Introduction

This project is a plugin for AMLL Player. extSpotify can give the capability of connecting
Spotify API service to AMLL Player. When you enable this plugin, extSpotify will control
AMLL Player's behavior of playing songs. 

To use this plugin, you need to create a Spotify App on Spotify Developer Platform. extSpotify
will use your client-id, callback url and access token to access API. We promise all your data
will only save in local file and not send them to third-party server include ours. All source
code will be opened on Github.

We will provide i18n in a few months.

## Attention

This plugin still in progress. Maybe cause some unexpected effects.

## AMLL Player Plugin Template

Quick Start:

```bash
pnpm i
pnpm build:dev # Build plugin with source map
pnpm build:src # Build minified plugin with source map
pnpm build # Build minified plugin without source map
```

Modify `amllPlayerMeta` fields in `package.json` to customize your plugin.
