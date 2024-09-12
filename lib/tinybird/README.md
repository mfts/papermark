## Add new pipes to Tinybird

So you added a new pipe to Tinybird and want to push that to the server.

```sh
tb push lib/tinybird/endpoints/<PIPENAME>.pipe
```

## Danger Zone

### Delete a data from datasource

```sh
tb datasource delete page_views__v3 --dry-run --sql-condition "viewId='VIEWID' and CAST(pageNumber AS UInt8) = PAGENUMBER" --wait
```
