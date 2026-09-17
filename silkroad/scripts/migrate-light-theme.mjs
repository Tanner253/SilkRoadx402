import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const strong = /(?:^|\s)!?bg-(?:\[#(?:F97316|9945FF|14F195)\]|(?:green|red|blue|purple|yellow|amber)-(?:[567]00))(?=\s|$)/i;
function convert(value) {
  const onColor=strong.test(value);
  return value.replace(/(?:dark:)+[^\s"'`]+/g,'').replace(/(?<![\w-])((?:(?:hover|focus|focus-visible|active|disabled|group-hover|placeholder|sm|md|lg):)*)(!?)(bg|text|border|divide|ring|shadow|from|via|to|placeholder)-((?:\[[^\]\s]+\]|[a-z]+(?:-\d+)?)(?:\/(?:\[[^\]]+\]|[\d.]+))?)/g,(full,variant,bang,kind,color)=>{
    const [base,alpha]=color.split('/');
    let target;
    const brand=/^\[#(?:F97316|FBBF24|9945FF|14F195|ea6c0e)\]$/i.test(base)||/^(orange|purple)-\d+$/.test(base);
    const dark=/^\[#(?:0f0d0a|0f0f14)\]$/i.test(base);
    if(kind==='text') {
      if(base==='white') target=onColor&&!alpha?'primary-foreground':alpha&&Number(alpha)<80?'muted-foreground':'foreground';
      else if(base==='black') target=onColor?'primary-foreground':'foreground';
      else if(brand) target='primary';
      else if(/^zinc-/.test(base)) target=/zinc-(50|200|300|900)$/.test(base)?'foreground':'muted-foreground';
      else if(/^(green|red|yellow|blue|amber|cyan)-[1-5]00$/.test(base)) target=base.replace(/-\d+$/,'-700');
    }
    if(kind==='bg') {
      if(dark) target='background'+(alpha?'/'+alpha:'');
      else if(base==='white') target=alpha?'muted':'card';
      else if(brand) target=alpha||/-(?:8|9)\d+$/.test(base)?'accent':'primary';
      else if(/^zinc-/.test(base)) target=/zinc-(?:800|900|950)$/.test(base)?'card':'muted';
      else if(base==='black'&&alpha&&Number(alpha)<60) target='muted';
      else if(/^(green|red|yellow|blue|amber)-(?:8|9)\d+$/.test(base)) target=base.replace(/-\d+$/,'-50');
    }
    if(kind==='border'||kind==='divide') {
      if(brand||dark||base==='white'||/^zinc-/.test(base)) target='border';
      else if(/^(green|red|yellow|blue|amber)-(?:[6-9])\d+$/.test(base)) target=base.replace(/-\d+$/,'-200');
    }
    if(kind==='ring'&&brand) target='ring';
    if(kind==='shadow'&&brand) target='none';
    if((kind==='from'||kind==='via'||kind==='to')&&(/^(zinc|black)/.test(base)||dark)) target='background';
    return target?variant+bang+kind+'-'+target:full;
  });
}
let files=0;
function walk(dir) {
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
  const p=path.join(dir,entry.name);
  if(entry.isDirectory()) { if(entry.name!=='api') walk(p); continue; }
  if(!p.endsWith('.tsx')||/PiggyScene|HeroScene|Globe3D/.test(p)) continue;
  let src=fs.readFileSync(p,'utf8');const edits=[];
  const ast=ts.createSourceFile(p,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function visit(n) {
    if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n)) {
      const start=n.getStart(ast),end=n.getEnd(),raw=src.slice(start,end),next=convert(raw);
      if(next!==raw) edits.push({start,end,next});
    } else ts.forEachChild(n,visit);
  }
  visit(ast);for(const e of edits.sort((a,b)=>b.start-a.start)) src=src.slice(0,e.start)+e.next+src.slice(e.end);
  if(edits.length) {fs.writeFileSync(p,src);files++;}
 }
}
walk('app');walk('components');console.log('Migrated theme utilities in',files,'components/pages');
