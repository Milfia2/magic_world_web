// NPC-only greetings, addressed to the selected role. The player stays silent.
const greeting=(action,text)=>({action,text});
export const GREETINGS = {
  abby: {
    thea:greeting('西婭笑著替艾比把翹起的緞帶撫平。','Abby，過來一點。蝴蝶結又翹起來了……嗯，這樣就好。要不要喝茶？'),
    gaile:greeting('蓋勒把手上的書闔起來，替艾比留出身旁的位置。','早，Abby。又留下來練習了？先喘口氣，我把這本放好就陪妳。'),
    zephyr:greeting('澤菲爾站直身子，順手接住艾比快滑下來的書。','喔，Abby。跑這麼快，又發現什麼好玩的？走啊，我跟妳去。'),
  },
  thea: {
    abby:greeting('艾比立刻湊過來，眼睛亮亮地看著西婭。','Thea！妳去哪裡了！我剛練會新的符咒，妳要不要看？'),
    gaile:greeting('蓋勒將筆記往旁邊挪，留出可以放杯子的位置。','Thea，坐這裡吧，這邊沒有風。妳的課本我一起帶來了。'),
    zephyr:greeting('看見西婭，他立刻站直，又把視線移向一旁。','喔，Thea。終於……沒什麼，我也剛到。妳接下來去哪？'),
  },
  gaile: {
    abby:greeting('艾比朝蓋勒揮了揮手，往旁邊挪出一點空位。','Caleb！來這邊！你手又好冰喔。Abby很溫暖，可以靠近一點！'),
    thea:greeting('西婭拿開身旁的葉子，把另一只杯子推過去。','啊，Caleb。茶還是熱的。你也休息一下吧，不用一直忙。'),
    zephyr:greeting('澤菲爾往蓋勒身邊靠了靠，聲音比平常輕了一點。','喔，Caleb。你現在有空嗎？沒什麼大事……借我待在旁邊就好。'),
  },
  zephyr: {
    abby:greeting('艾比轉過身，眼睛一下亮了起來。','Zephyr！你來得正好！我正想找人一起去看看，走啦！不准臨時跑掉喔！'),
    thea:greeting('西婭抬眼看了澤菲爾一會兒，慢慢笑起來。','Zephyr。又剛好經過嗎？……那坐近一點吧，這裡還有餅乾。'),
    gaile:greeting('蓋勒將旁邊的東西收好，抬頭看向澤菲爾。','Zephyr，這裡沒有人，坐吧。練習結束了？你今天有吃東西嗎？'),
  },
};
export const greetingFor=(player,speaker)=>GREETINGS[player]?.[speaker] || null;
