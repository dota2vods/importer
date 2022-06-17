dota2vods/importer
==================

Command to automatically import and update tournament data for the [dota2vods/tournament-data](https://github.com/dota2vods/tournament-data)
project.

See [dota2vods/tournament-data](https://github.com/dota2vods/tournament-data) for more information.

**This project is *Work in progress*. It is not working yet.**

Supported sources
-----------------

The code is built to support multiple sources but only [Liquipedia](https://liquipedia.net/) is implemented right
now.

Usage
-----

```shell script
$ yarn add @dota2vods/importer
$ yarn run dota2vods-importer --help
Usage: yarn run dota2vods-importer [command] [argument]

Command to automatically import and update tournament data for the dota2vods/tournament-data project.

Options:
  -h, --help                                    display help for command

Commands:
  import-collection [options] <collection_url>  Import or update all tournaments of a collection (mainly used for automation).
  import [options] <tournament_url>             Import a new tournament or update an existing one. (Default behaviour if no command is specified)
  list-importers                                Lists all available importers.
  help [command]                                display help for command
```
