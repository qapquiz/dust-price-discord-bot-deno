import { serve } from "https://deno.land/std/http/server.ts";
import { ActivityTypes, Bot, createBot, DiscordenoInteraction, DiscordenoUser, startBot } from 'https://deno.land/x/discordeno@13.0.0-rc18/mod.ts';
import { BotWithCache, enableCachePlugin, enableCacheSweepers } from 'https://deno.land/x/discordeno_cache_plugin@0.0.21/mod.ts';
import 'https://deno.land/x/dotenv@v3.2.0/load.ts';

async function getDustPrice(): Promise<string> {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=dust-protocol&vs_currencies=usd');
    const dustPrice = await response.json();

    return dustPrice['dust-protocol']['usd'].toString();
}

async function setDustPriceDiscordStatus(bot: Bot): Promise<void> {
    try {
        const dustPrice = await getDustPrice();
        bot.helpers.editBotStatus({
            status: 'online',
            activities: [
                {
                    type: ActivityTypes.Watching,
                    name: `DUST: \$${dustPrice}`,
                    createdAt: new Date().getTime(),
                },
            ]
        });
    } catch (error) {
        console.error(error);
    }
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

            switch (interaction.data?.name) {
                case 'ping':
                    await bot.helpers.sendMessage(
                        interaction.channelId,
                        {
                            content: 'pong!',
                        }
                    );
                    break;
                case 'dustprice':
                    try {
                        const dustPrice = await getDustPrice();
                        await bot.helpers.sendMessage(
                            interaction.channelId,
                            {
                                content: `DUST: \$${dustPrice}`,
                            }
                        )
                    } catch (error) {
                        console.error(error);
                    }
                    break;
                default:
                    break;
            }

            if (interaction.data?.name === 'ping') { // ping
                
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
    await setDustPriceDiscordStatus(bot);
}, 10000);

serve((_req) => new Response('still alive!'));
await startBot(bot);