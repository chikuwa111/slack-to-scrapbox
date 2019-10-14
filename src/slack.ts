export type SlackMessage = {
  type: string;
  text: string;
  ts: string;
  thread_ts: string;
  attachments?: { title: string; title_link: string; image_url?: string }[];
  replies?: { user: string; ts: string }[];
  parent_user_id?: string;
};

type SlackReply = {
  text: string;
  ts: string;
};

function isParent({ parent_user_id }: SlackMessage) {
  return parent_user_id == null;
}

function getDateString(ts: string) {
  return new Date(parseInt(ts) * 1000).toLocaleString("ja-JP");
}

function getReplyList(
  parentMessage: SlackMessage,
  json: SlackMessage[]
): SlackReply[] {
  const { replies } = parentMessage;
  if (replies == null) return [];

  const replyTsList = replies.map(reply => reply.ts);
  const replyList = replyTsList.map(ts => {
    const reply = json.find(message => message.ts === ts);
    if (reply == null)
      return {
        ts,
        text: `Failed to find reply (ts: ${ts}) #fromSlack--notfoundreply`,
      };

    return { ts, text: reply.text };
  });
  return replyList;
}

function getTitleForScrapbox({ text, attachments }: SlackMessage) {
  const title = attachments != null ? attachments[0].title : text;
  return encodeURIComponent(title.replace(/\n/g, " "));
}

function makeBodyForScrapbox(
  { ts, attachments }: SlackMessage,
  replies: SlackReply[]
) {
  const lines = [];
  if (attachments != null) {
    const { title, title_link, image_url } = attachments[0];
    if (image_url != null) lines.push(`[${image_url}]`, "");
    lines.push(`[${title_link} ${title}]`, "");
  }

  const dateString = getDateString(ts);
  lines.push("個人slackの`#articles`より" + ` (${dateString}投稿)`, "");

  replies.forEach(reply => {
    const dateString = getDateString(reply.ts);
    lines.push(`${reply.text} (${dateString})`, "");
  });

  lines.push("#pick", "#fromSlack", "#fromSlack--pending", "");

  return encodeURIComponent(
    lines
      .join("\n")
      .replace(/\\/g, "")
      .replace(/&gt;/g, ">")
  );
}

export default function getTitleAndBodyForScrapbox(
  message: SlackMessage,
  json: SlackMessage[]
) {
  if (!isParent(message)) return;

  const replies = getReplyList(message, json);
  const title = getTitleForScrapbox(message);
  const body = makeBodyForScrapbox(message, replies);

  return { title, body };
}
