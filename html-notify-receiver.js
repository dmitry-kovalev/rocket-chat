const extrasRegex = /<\/?(?:address|section|article|span).*?>/gim
const stylesRegex = /<\/?(?:div|b|i|a|img|em|p|h\d?).*?>/gim

function processLinks(html) {
  let start = html.indexOf('<a ');
  while (start >= 0) {
    let end = html.indexOf('</a>', start + 1);
    let link = html.substring(start, end + 4);
    let hStart = link.indexOf('href="');
    let hEnd = link.indexOf('"', hStart + 6);
    let href = link.substring(hStart + 6, hEnd);
    let tStart = link.indexOf('>');
    let tEnd = link.indexOf('<', tStart);
    let title = link.substring(tStart + 1, tEnd);
    let mdLink = `[${title}](${href})`;
    html = html.replace(link, mdLink);
    start = html.indexOf('<a ');
  }
  return html;
}

function processImgs(html) {
  let start = html.indexOf('<img ');
  while (start >= 0) {
    let end = html.indexOf('>', start + 1);
    let img = html.substring(start, end + 1);
    let sStart = img.indexOf('src="');
    let sEnd = img.indexOf('"', sStart + 5);
    let src = img.substring(sStart + 5, sEnd);

    let tStart = img.indexOf('alt="');
    let tEnd = img.indexOf('"', tStart + 5);
    let title = img.substring(tStart + 5, tEnd);
    let mdImg = `![${title}](${src})`;
    html = html.replace(img, mdImg);
    start = html.indexOf('<img ');
  }
  return html;
}

function makeMarkdown(html) {
  let md = html;
  md = md.replace(extrasRegex, '');
  md = md.replace(/<br\/?>/gi, "\n");
  md = md.replace(/<b>|<\/b>|<strong>|<\/strong>/gi, "**");
  md = md.replace(/<i>|<\/i>|<em>|<\/em>/gi, "*");
  md = md.replace(/<p\s?.*?>/gi, "\n");
  md = md.replace(/<\/p>/gi, "\n\n");
  md = md.replace(/<blockquote>\n?/gi, "> ");
  md = md.replace(/<\/blockquote>/gi, "");
  md = md.replace(/<h.?>/gi, "# ");
  md = md.replace(/<\/h.?>/gi, "\n");
  md = processLinks(md);
  md = processImgs(md);
  return md;
}

function makePlain(html) {
  let md = html;
  md = md.replace(extrasRegex, '');
  md = md.replace(stylesRegex, '');
  md = md.replace('\n\n', '\n');
  md = md.replace('^\s*', '');
  return md;
}

class Script {
  process_incoming_request({request}) {
    let content = request.content;

    let message_icon = content.emoji || ':rocket:';
    let attachments = [{}];
    let text = '';
    let plain = '';
    let username = content.username || 'Rocket Chat Notifier';
    if (content.attachments) {
      let attachment = {};
      if (Array.isArray(content.attachments) && content.attachments.length > 0) {
        attachment = content.attachments[0];
      }
      for (let key in attachment) {
        attachments[0][key] = attachment[key];
        if (key == 'text') {
          attachments[0][key] = makeMarkdown(attachments[0][key]);
          plain = makePlain(attachment[key]);
        }
      }
    }
    if (content.message) {
      text = makePlain(content.message);
      if (!attachments[0]['text']) {
          attachments[0]['text'] = makeMarkdown(text);
      }
    } else {
      text = attachments[0]['text'];
    }

    return {
      content: {
        username: username,
        icon_emoji: message_icon,
        text: text || 'notify received',
        attachments: attachments
      }
    };
  }
}
