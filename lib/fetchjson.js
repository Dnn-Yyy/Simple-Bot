import axios from 'axios';

async function fetchJson(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching JSON:', error);
        throw error;
    }
}

export default fetchJson;