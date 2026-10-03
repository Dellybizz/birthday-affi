create policy layout_backup_no_client_access on private.page_layout_backups for all to anon,authenticated using(false) with check(false);
