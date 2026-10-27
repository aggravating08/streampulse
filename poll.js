export function createPoll(question, options) {
  if(typeof question!=='string'||!question.trim()||question.length>140) throw Error('Use a question of 1–140 characters.');
  if(!Array.isArray(options)||options.length<2||options.length>4||options.some(x=>typeof x!=='string'||!x.trim()||x.length>60)) throw Error('Choose 2–4 answers, each 1–60 characters.');
  return {question:question.trim(),options:options.map(x=>x.trim()),counts:options.map(()=>0),voters:new Map(),open:true,createdAt:Date.now()};
}
export function vote(poll,user,index){
  if(!poll?.open||!Number.isInteger(index)||index<0||index>=poll.options.length)return false;
  const previous=poll.voters.get(user); if(previous===index)return false;
  if(previous!==undefined)poll.counts[previous]--;
  poll.voters.set(user,index);poll.counts[index]++;return true;
}
export function publicPoll(poll){if(!poll)return null;const {voters,...rest}=poll;return {...rest,total:voters.size,simulatedCount:[...voters.keys()].filter(x=>x.startsWith('demo:')).length};}
export function parseVote(line){const m=line.match(/^@([^ ]+) :[^ ]+ PRIVMSG #[^ ]+ :!vote\s+([1-4])\s*$/i);if(!m)return null;const tags=Object.fromEntries(m[1].split(';').map(x=>x.split('=')));return tags['user-id']?{user:tags['user-id'],index:Number(m[2])-1}:null;}
