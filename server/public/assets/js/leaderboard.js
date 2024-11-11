const logo_BC = "/logo/logo_BC.png";
const logo_DST = "/logo/logo_DST.png";
const logo_DVT = "/logo/logo_DVT.png";
const logo_LT = "/logo/logo_LT.png";
const logo_NH = "/logo/logo_NH.png";
const logo_NHH = "/logo/logo_NHH.png";
const logo_NTN = "/logo/logo_NTN.png";
const logo_TP = "/logo/logo_TP.png";

function compare( a, b ) {
  if ( a.score > b.score ){
    return -1;
  }
  if ( a.score < b.score ){
    return 1;
  }
  return 0;
}


function createTable(name, array) {
  // array.sort(function (a, b) {
  //   return a.score < b.score;
  // });
  // console.log(array)
  array.sort( compare );
  let variable =
    '  <div class="flex flex-col rounded-[24px] rank w-full gap-3">' +
    `        <p class="text-[#1C1A1F] text-center text-[32px]">Bảng ${name}</p>` +
    '        <div class="top1-container">' +
    '          <div class="top1-img-container">' +
    "            <div" +
    '              class="top1-img-number">' +
    '              <p class="top1-img-number-text" >1</p>' +
    "            </div>" +
    `            <img src="${array[0].image_link}" class="w-full h-full object-cover rounded-full" />` +
    "          </div>" +
    `          <p class="top1-name">${array[0].name}</p>` +
    `          <p class="top1.score">${array[0].score}</p>` +
    "        </div>" +
    '        <div class="top3-container">' +
    '          <div class="school-container">' +
    '            <div class="top3-rank-container top2-rank-bg">' +
    '              <p class="top3-rank">#2</p>' +
    "            </div>" +
    `            <img src="${array[1].image_link}" class="top3-img" />` +
    `            <p class="text-[#1C1A1F] text-[16px] font-[700]">${array[1].name}</p>` +
    `            <p class="text-[#777E90] text-[16px] font-[700] ml-auto">${array[1].score}</p>` +
    "          </div>" +
    '          <div class="school-container">' +
    '            <div class="top3-rank-container top3-rank-bg">' +
    '              <p class="top3-rank">#3</p>' +
    "            </div>" +
    `            <img src="${array[2].image_link}" class="top3-img" />` +
    `            <p class="text-[#1C1A1F] text-[16px] font-[700]">${array[2].name}</p>` +
    `            <p class="text-[#777E90] text-[16px] font-[700] ml-auto">${array[2].score}</p>` +
    "          </div>" +
    "        </div>" +
    "      </div>" +
    "";
  document.getElementById("root").innerHTML += variable;
  // console.log(document.getElementById("root"));
}
function clearRoot(){
  document.getElementById("root").innerHTML = '';
}
var socket = io('http://192.168.0.101:3001');
socket.emit('call-list');
socket.on('update-leader-board', async(teamList)=>{
  clearRoot();
  let groupA = [];
  await teamList.forEach(async (element) => {
    if (element.group == "A") await groupA.push(element);
  });

  let groupB = [];
  await teamList.forEach(async (element) => {
    if (element.group == "B") await groupB.push(element);
  });

  let groupC = [];
  await teamList.forEach(async (element) => {
    if (element.group == "C") await groupC.push(element);
  });

  let groupD = [];
  await teamList.forEach(async (element) => {
    if (element.group == "D") await groupD.push(element);
  });

  createTable("A", groupA);
  createTable("B", groupB);
  createTable("C", groupC);
  createTable("D", groupD);
})
// const tableA = [
//   {
//     name: "Trường THPT 1",
//     image_link: logo_NHH,
//     score: 12,
//   },
//   {
//     name: "Trường THPT 2",
//     image_link: logo_NTN,
//     score: 9,
//   },
//   {
//     name: "Trường THPT 3",
//     image_link: logo_NTN,
//     score: 8,
//   },
// ];
// createTable("A", tableA);
// createTable("B", tableA);
// createTable("C", tableA);
