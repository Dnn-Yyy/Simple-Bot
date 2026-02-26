import axios from "axios";
import cheerio from "cheerio";
import qs from "qs";

let handler = async (m, {
    conn,
    usedPrefix,
    command,
    text
}) => {
    if (!text) return m.reply(`• *Example* : ${usedPrefix + command} *[instagram url]*`);
    if (!text.includes('instagram.com')) return m.reply(`• *Example* : ${usedPrefix + command} *[instagram url]*`);

    await conn.sendMessage(m.chat, {
        react: {
            text: "🕊️",
            key: m.key
        }
    });

    try {
        const result = await Instagram(text);
        if (!result.url || result.url.length === 0) return m.reply("*Tidak ada media yang ditemukan.*");

        const mediaUrls = result.url;
        const metadata = result.metadata;

        const caption = `┌─⭓「 *Instagram Downloader* 」\n│ *• Likes :* ${metadata.like}\n│ *• Comment :* ${metadata.comment}\n│ *• Author :* ${metadata.username}\n└───────────────⭓\n*• Title :* ${metadata.caption}`.trim();

        for (const mediaUrl of mediaUrls) {
            await conn.sendFile(m.chat, mediaUrl, "", caption, m);
        }
    } catch (error) {
        m.reply(error);
    }
};

handler.help = ["ig", "instagram", "igdl"].map((a) => a + " *instagram url*");
handler.tags = ["downloader"];
handler.command = ["ig", "instagram", "igdl"];

export default handler;

function formatShortNumber(number) {
    if (number >= 1e6) return (number / 1e6).toFixed(1) + "M";
    if (number >= 1e3) return (number / 1e3).toFixed(1) + "K";
    return number.toString();
}

const getDownloadLinks = (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (
                !url.match(/(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/)
                && !url.match(/(https|http):\/\/www.instagram.com\/(p|reel|tv|stories)/gi)
            ) {
                return reject({ msg: "Invalid URL" });
            }

            function decodeData(data) {
                let [part1, part2, part3, part4, part5, part6] = data;
                function decodeSegment(segment, base, length) {
                    const charSet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");
                    let baseSet = charSet.slice(0, base);
                    let decodeSet = charSet.slice(0, length);
                    let decodedValue = segment.split("").reverse().reduce((accum, char, index) => {
                        if (baseSet.indexOf(char) !== -1) {
                            return accum += baseSet.indexOf(char) * Math.pow(base, index);
                        }
                    }, 0);

                    let result = "";
                    while (decodedValue > 0) {
                        result = decodeSet[decodedValue % length] + result;
                        decodedValue = Math.floor(decodedValue / length);
                    }
                    return result || "0";
                }

                part6 = "";
                for (let i = 0, len = part1.length; i < len; i++) {
                    let segment = "";
                    while (part1[i] !== part3[part5]) {
                        segment += part1[i];
                        i++;
                    }
                    for (let j = 0; j < part3.length; j++) {
                        segment = segment.replace(new RegExp(part3[j], "g"), j.toString());
                    }
                    part6 += String.fromCharCode(decodeSegment(segment, part5, 10) - part4);
                }
                return decodeURIComponent(encodeURIComponent(part6));
            }

            function extractParams(data) {
                return data
                    .split("decodeURIComponent(escape(r))}(")[1]
                    .split("))")[0]
                    .split(",")
                    .map((item) => item.replace(/"/g, "").trim());
            }

            function extractDownloadUrl(data) {
                return data
                    .split('getElementById("download-section").innerHTML = "')[1]
                    .split('"; document.getElementById("inputData").remove(); ')[0]
                    .replace(/\\(\\)?/g, "");
            }

            function getVideoUrl(data) {
                return extractDownloadUrl(decodeData(extractParams(data)));
            }

            const response = await axios.post(
                "https://snapsave.app/action.php?lang=id",
                "url=" + url,
                {
                    headers: {
                        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                        "content-type": "application/x-www-form-urlencoded",
                        origin: "https://snapsave.app",
                        referer: "https://snapsave.app/id",
                        "user-agent": "Mozilla/5.0"
                    }
                }
            );

            const data = response.data;
            const videoPageContent = getVideoUrl(data);
            const $ = cheerio.load(videoPageContent);
            const downloadLinks = [];

            $("div.download-items__thumb").each((index, item) => {
                $("div.download-items__btn").each((btnIndex, button) => {
                    let dl = $(button).find("a").attr("href");
                    if (!/https?:\/\//.test(dl || "")) dl = "https://snapsave.app" + dl;
                    downloadLinks.push(dl);
                });
            });

            if (!downloadLinks.length) return reject({ msg: "No data found" });

            resolve({
                url: downloadLinks,
                metadata: { url }
            });
        } catch (error) {
            reject({ msg: error.message });
        }
    });
};

const HEADERS = {
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Content-Type": "application/x-www-form-urlencoded",
    "X-FB-Friendly-Name": "PolarisPostActionLoadPostQueryQuery",
    "X-CSRFToken": "RVDUooU5MYsBbS1CNN3CzVAuEP8oHB52",
    "X-IG-App-ID": "1217981644879628",
    "X-FB-LSD": "AVqbxe3J_YA",
    "X-ASBD-ID": "129477",
    "User-Agent": "Mozilla/5.0"
};

function getInstagramPostId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|tv|stories|reel)\/([^/?#&]+).*/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function encodeGraphqlRequestData(shortcode) {
    const requestData = {
        av: "0",
        __d: "www",
        __user: "0",
        __a: "1",
        __req: "3",
        dpr: "3",
        variables: JSON.stringify({
            shortcode: shortcode,
            fetch_comment_count: null,
            fetch_related_profile_media_count: null,
            parent_comment_count: null,
            child_comment_count: null,
            fetch_like_count: null,
            fetch_tagged_user_count: null,
            fetch_preview_comment_count: null,
            has_threaded_comments: false,
            hoisted_comment_id: null,
            hoisted_reply_id: null,
        }),
        server_timestamps: "true",
        doc_id: "10015901848480474",
    };

    return qs.stringify(requestData);
}

async function getPostGraphqlData(postId, proxy) {
    const encodedData = encodeGraphqlRequestData(postId);
    const res = await axios.post("https://www.instagram.com/api/graphql", encodedData, {
        headers: HEADERS,
        httpsAgent: proxy
    });
    return res.data;
}

function extractPostInfo(mediaData) {
    const getUrl = (data) => {
        if (data.edge_sidecar_to_children) {
            return data.edge_sidecar_to_children.edges.map(
                (edge) => edge.node.video_url || edge.node.display_url
            );
        }
        return data.video_url ? [data.video_url] : [data.display_url];
    };

    return {
        url: getUrl(mediaData),
        metadata: {
            caption: mediaData.edge_media_to_caption.edges[0]?.node.text || null,
            username: mediaData.owner.username,
            like: mediaData.edge_media_preview_like.count,
            comment: mediaData.edge_media_to_comment.count,
            isVideo: mediaData.is_video,
        }
    };
}

async function ig(url, proxy = null) {
    const postId = getInstagramPostId(url);
    if (!postId) throw new Error("Invalid Instagram URL");
    const data = await getPostGraphqlData(postId, proxy);
    const mediaData = data.data?.xdt_shortcode_media;
    return extractPostInfo(mediaData);
}

async function Instagram(url) {
    try {
        return await ig(url);
    } catch (e) {
        try {
            return await getDownloadLinks(url);
        } catch (e2) {
            return { msg: "Try again later" };
        }
    }
}