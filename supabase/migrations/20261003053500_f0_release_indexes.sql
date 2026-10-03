-- F0 follow-up: cover release-manifest foreign keys reported by the database advisor.
create index site_release_pages_page_id_idx on public.site_release_pages(page_id);
create index site_release_pages_page_version_id_idx on public.site_release_pages(page_version_id);
create index site_releases_configuration_version_id_idx on public.site_releases(configuration_version_id);
create index site_releases_navigation_version_id_idx on public.site_releases(navigation_version_id);
create index site_releases_created_by_idx on public.site_releases(created_by);
