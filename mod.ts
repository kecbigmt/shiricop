import { json, serve } from 'https://deno.land/x/sift@0.5.0/mod.ts';
import { env } from './deps.ts';

const SLACK_BOT_USER_OAUTH_TOKEN = env.get('SLACK_BOT_USER_OAUTH_TOKEN');

if (!SLACK_BOT_USER_OAUTH_TOKEN) {
  throw new Error('SLACK_BOT_USER_OAUTH_TOKEN not found');
}

serve({
  '/slack/action-endpoint': async (request: Request) => {
    const body = await request.json();
    console.log(JSON.stringify(body));

    switch (body.type) {
      case 'url_verification':
        return json({ challenge: body.challenge });
      case 'event_callback': {
        // ボットからのメッセージなら無視する
        if (body.event.bot_id) return;

        switch (body.event.type) {
          case 'message': {
            const channel = body.event.channel;
            if (!channel) throw new Error('channel not found');
            const text = body.event.text;
            if (!text) throw new Error('text not found');

            const response = await fetch(
              'https://slack.com/api/chat.postMessage',
              {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + SLACK_BOT_USER_OAUTH_TOKEN,
                  'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({
                  channel,
                  text: text + 'だね！',
                }),
              },
            );

            if (!response.ok) {
              throw new Error(
                'chat.postMessage error' + JSON.stringify(response.body),
              );
            }

            return;
          }
          default: {
            // TODO: 制御する
            return;
          }
        }
      }
      default: {
        // TODO: 制御する
        return;
      }
    }
  },
});
