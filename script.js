const rows = [
    ["title", "teksSubchapter", "description"]
];

const subchapter = document.querySelector('td[width="160"]').textContent.split('§')[1];
const subchapterValue = subchapter + '.';
const continueLink = document.querySelector('a[name="Continued"]');
const params = new URLSearchParams(window.location.search);
let nextPageTitleStart = '';
let pageNumber = params.has('pg') ? params.get('pg') : 1;

console.log(window.location.search);

const trimDescription = function(desc) {
    const descStart = desc.indexOf(')') + 2;
    // remove all line endings, all quotes, and '; and' from end of some skills
    const newDesc = desc
    .replaceAll('\n', '')
    .replaceAll('"', '')
    .replace(/; and$/, ';')
    .slice(descStart);
    return '"' + newDesc + '"';
}
const trimTitle = function(desc) {
    const titleEnd = desc.indexOf(')') + 1;
    return desc.slice(0, titleEnd);
}

const alertCSV = function() {
    const csvContent = "data:text/csv;charset=utf-8," 
    + rows.map(e => e.join(",")).join("\n");
    // const currentDate = new Date().toLocaleDateString("en-US").replaceAll('/', '-');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const fileName = `${subchapter}_p${pageNumber}.csv`;
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);

    if (window.confirm(`Would you like to download ${fileName}`)) {
        link.click();
    }
}

const alertContinue = function() {
    if (!continueLink) return;
    const message = 'This rule is split across multiple pages, press OK to go to the next page, then run the bookmarklet again.'
    if (window.confirm(message)) {
        continueLink.href += `#titleStart${nextPageTitleStart}`;
        continueLink.click();
    }
}

const fillSkillData = function(skill, sectionTitle, leadingSkillTitle = '') {
    const skillRow = [sectionTitle, subchapterValue];
            let skillRawValue = '';

            // Skills without subskills
            if (skill.nodeName == 'PP' && skill.children[0].children.length == 1) {
                skillRawValue = skill.children[0].innerText;
                skillRow[0]+= trimTitle(skillRawValue);
                skillRow.push(
                    trimDescription(skillRawValue)
                );
                rows.push(skillRow);
    
            // Skills with subskills
            } else if (skill.nodeName == 'PP' && skill.children[0].children.length > 1) {
                skillRawValue = skill.childNodes[1].childNodes[0].nodeValue;
                let subSkillRowTitleStart = skillRow[0] += trimTitle(skillRawValue);
                
                skillRow.push(trimDescription(skillRawValue));
                rows.push(skillRow);
                // Subskills
                const subskills = [...skill.childNodes[1].children];
                subskills.forEach(subskill => {
                    const subskillRow = [subSkillRowTitleStart, subchapterValue];
                    if (subskill.nodeName == 'SP') {
                        let subskillRawValue = subskill.children[0].innerText;
                        subskillRow[0] += trimTitle(subskillRawValue);
                        subskillRow.push(
                            trimDescription(subskillRawValue)
                        );
                        rows.push(subskillRow);
                    }
                });
                nextPageTitleStart = subSkillRowTitleStart;

            // Leading Subkills (p2+)
            } else if (skill.nodeName == 'SP') {
                const leadingSubskills = [...skill.children];
                leadingSubskills.forEach(subskill => {
                    skillRawValue = subskill.childNodes[0].nodeValue;
                    const leadingSubskillRow = [leadingSkillTitle, subchapterValue];
                    leadingSubskillRow[0] += trimTitle(skillRawValue);
                    leadingSubskillRow.push(trimDescription(skillRawValue));
                    rows.push(leadingSubskillRow);
                })
            }
}

const parsePage1 = function() {
    const sections = document.querySelectorAll('ss > no');
    sections.forEach(section => {
        // If not a knowledage and skills section, skip it.
        if (!/^\([b,c]\) Knowledge and skills./.test(section.textContent)) return;
        const skills = [...section.children];
        const sectionTitle = subchapter + trimTitle(section.textContent);
        skills.forEach(skill => {
            fillSkillData(skill, sectionTitle);
        });
    });
}

const parsePage2 = function(pTwoTitleStart) {
    const skills = document.querySelectorAll('td > sp, td > pp');
    const titleIndex = pTwoTitleStart.lastIndexOf('(');
    const sectionTitle = pTwoTitleStart.slice(0,titleIndex);
    const leadingSkillTitle = pTwoTitleStart;
    skills.forEach(skill => {
        fillSkillData(skill, sectionTitle, leadingSkillTitle);
    });
}

const init = function() {
    const hash = window.location.hash;
    if (!hash) {
        parsePage1();
    } else if (hash.includes('titleStart')) {
        const currentPageTitleStart = hash.slice(11);
        parsePage2(currentPageTitleStart);
    }
    alertCSV();
    alertContinue(); 
}


init();
   