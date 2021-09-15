import { bold, gray, green } from 'kleur';
const metadata = require('../package.json');

const _titleLength = 99;

function shuffle(str:string) {
    let a = str.split("");
    let n =  a.length;

    for(let i = n - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

function space(str:string) {
    const spacer =  Array
        .from({length: ~~(Math.abs(_titleLength - str.length) / 2)})
        .fill(' ')
        .join('');
    return `${spacer}${str}${spacer}`;
}

function repeat(str:string) {
    return Array
        .from({length: ~~((_titleLength + str.length) / (str.length))})
        .fill(str)
        .join('')
        .slice(0,_titleLength + 1);
}

//const CHAR = '◉ ◍ ◳ ◲ ◱ ◰ ◴ ◵ ◶ ◷ ◧ ◩ ◪ ◨ ◫ ◎ ● ';
const CHAR = '◳◲◱◰';
const UPPER = CHAR.split('').reverse().join("").trim();//shuffle(CHAR);
//const THIRD = '◴◵◶◷'
const THIRD = Math.random() > .5 ? 
    '▲△▴▵▶▷▸⍟▹►▻▼▽▾▿◀◁◂◃◄◅◸◹◺◿▮▭▬▯▰▱◍◭◮◦◊◈▢◎◕◔◓◒◑◐⇶' :
    '▁▂▃▄▅▆▇█';
//const THIRD = '▁▂▃▄▅▆▇█'
//const THIRD = '⏧'
//const THIRD = '▁▂▃▄▅▆▇█';
//const THIRD = '▖▗▘▙▚▛▜▝▞▟'
const FIRST = CHAR.slice(0,1);
const titleText = "SKIT";

export default function fancyHeader() {
    console.clear();
    console.log();
    console.log();
    console.log();
    console.log(gray(shuffle(repeat(THIRD))));
    console.log(bold(repeat(UPPER)));
    console.log();

    console.log(space(`${titleText} ${metadata.version}`));
    console.log();

    console.log(bold(repeat(CHAR)));
    console.log(gray(shuffle(repeat(THIRD))));
    console.log();
    console.log();
}
