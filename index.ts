import { ActivityTypes, Bot, createBot, DiscordenoInteraction, DiscordenoUser, startBot } from 'https://deno.land/x/discordeno@13.0.0-rc18/mod.ts';
import { BotWithCache, enableCachePlugin, enableCacheSweepers } from 'https://deno.land/x/discordeno_cache_plugin@0.0.21/mod.ts';
import 'https://deno.land/x/dotenv@v3.2.0/load.ts';

async function getDustPrice(): Promise<string> {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=dust-protocol&vs_currencies=usd');
    const dustPrice = await response.json();

    return dustPrice['dust-protocol']['usd'].toString();
}

const baseBot = createBot({
    token: Deno.env.get('DISCORD_TOKEN') ?? '',
    intents: ['Guilds'],
    botId: BigInt(Deno.env.get('BOT_ID') ?? 0),
    events: {
        ready(_bot: Bot, payload: { user: DiscordenoUser }) {
            console.log(`Successfully logged in as ${payload.user.username}`);
        },
        interactionCreate: async (bot: Bot, interaction: DiscordenoInteraction) => {
            if (interaction.channelId === undefined) {
                return;
            }

            if (interaction.data?.name === 'ping') { // ping
                await bot.helpers.sendMessage(
                    interaction.channelId,
                    {
                        content: 'pong!',
                    }
                );
            }

            if (interaction.data?.name === 'dustprice') { // dustprice
                await bot.helpers.sendMessage(
                    interaction.channelId,
                    {
                        content: `DUST: \$${await getDustPrice()}`,
                    }
                )
                return;
            }
        },
    },
});

const bot: BotWithCache = enableCachePlugin(baseBot);
enableCacheSweepers(bot);

setInterval(async () => {
    bot.helpers.editBotStatus({
        status: 'online',
        activities: [
            {
                type: ActivityTypes.Watching,
                name: `DUST: \$${await getDustPrice()}`,
                createdAt: new Date().getTime(),
            },
        ]
    });
}, 10000);

await startBot(bot);