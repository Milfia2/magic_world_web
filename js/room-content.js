// Replace UTF-8 TXT files in content/diaries; no JavaScript changes required.
export const DIARY_PATHS = Object.fromEntries(['abby','thea','gaile','zephyr'].map(id=>[id,`./content/diaries/${id}.txt`]));
export async function readDiary(id, fetcher = fetch) {
  if (!Object.hasOwn(DIARY_PATHS,id)) throw new Error('Unknown diary');
  const response=await fetcher(DIARY_PATHS[id]);
  if(!response.ok)throw new Error('Diary unavailable');
  const text=(await response.text()).replace(/^\uFEFF/,'').trim();
  if(!text)throw new Error('Empty diary');
  return text;
}

export const ROOM_HOST_POINT = { name:'陪你坐坐', x:79, y:89, height:62 };
const line=(action,text)=>({action,text});
export const ROOM_REACTIONS = {
  abby: {
    diary:line('艾比飛快翻過前一頁，把攤開的日記推向你。','這頁可以看！前面那頁……不行，那是還沒成功的符咒！'),
    gift:line('她把書籤拿起來，得意地指著邊上的小圖案。','這個是我自己畫的！你喜歡的話，這張給你！'),
    window:line('艾比踮起腳，把窗戶往內拉了一點。','這樣會不會冷？要不要過來這邊！Abby很溫暖喔！'),
  },
  thea: {
    diary:line('西婭將夾在紙頁裡的小葉子拿開。','可以啊。字旁邊那個不是墨點……是腳印。'),
    gift:line('她從小盒子裡挑出一包茶，放到你手心。','這包給你。嗯……忘記是哪一種了，聞起來很好。'),
    window:line('她靠著窗沿，指向枝頭一個很小的影子。','牠剛剛也在看我們。坐下等一會兒，說不定會再過來。'),
  },
  gaile: {
    diary:line('蓋勒把散頁整理好，翻到一段寫得整齊的地方。','這一頁可以。旁邊有星座的位置，你看不懂的地方再問我。'),
    gift:line('他把抄好的星圖取出來，確認四角沒有折到。','這份本來就多抄了一張。拿去吧，晚上記得帶外套。'),
    window:line('他攏了攏圍巾，先伸手試了一下窗縫的風。','好冷……把窗戶關上吧。星星隔著玻璃也看得到。'),
  },
  zephyr: {
    diary:line('澤菲爾按住日記，想了想，只翻開其中一頁。','就這頁。……不是有什麼不能看的，你別笑就好。'),
    gift:line('他把緞帶繞過手指，又若無其事地放到你面前。','這個你上次看了很久吧？留給你的。拿著啊。'),
    window:line('他把另一張椅子拉到窗邊，手卻還搭在椅背上。','這裡風剛好。你坐這張。……再待一下吧，反正也沒別的事。'),
  },
};
