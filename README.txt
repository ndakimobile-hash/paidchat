PaidChat.site · Mfumo wa majaribio kwa Cloudflare Pages

1. Fungua ZIP. Pakia faili na folda zote kutoka ndani ya ZIP kwenye mzizi wa repo mpya.
2. Unganisha repo na Cloudflare Pages. Chagua Framework preset: None.
   Acha Build command wazi na weka Build output directory kuwa ".".
   Folda functions inahitajika ili login na API ya dashboard zifanye kazi.
3. Kwenye Settings ya project, weka secrets hizi kwenye mazingira utakayotumia:
   DASHBOARD_PASSWORD: Chagua nenosiri lenye angalau herufi 12.
   DASHBOARD_SESSION_SECRET: Tumia thamani tofauti ya nasibu yenye angalau herufi 32.
4. Unda D1 database. Iunganishe kwenye project kwa jina PAIDCHAT_DB.
   Jedwali linaundwa lenyewe wakati API inapotumika kwa mara ya kwanza.
5. Fanya deploy upya. Fungua /dashboard/login au bonyeza PaidChat juu.
   Username: Geepesa01. Password ni thamani uliyoweka kwenye DASHBOARD_PASSWORD.
6. Unganisha paidchat.site kwenye Custom domains za project ukitaka kuiweka live.

Chat, salio na miamala ni ya majaribio. Kiungo cha usajili kinafungua FurusaWeb.
