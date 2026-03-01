import get from 'lodash/get';

/**
 * Normalizza formati NMOS in categorie: video | audio | anc | data | unknown
 * NB: ANC spesso arriva come "data" nei device; qui proviamo a riconoscerlo
 * dal format e (quando disponibile) da caps/label (euristiche leggere).
 */
export function categoryFromFormat(format) {
    const f = String(format || '').toLowerCase();

    // NMOS format urn (IS-04)
    if (f.includes('urn:x-nmos:format:video')) return 'video';
    if (f.includes('urn:x-nmos:format:audio')) return 'audio';
    if (f.includes('urn:x-nmos:format:data')) return 'data';

    // Fallback euristico (capita che alcuni strumenti espongano stringhe diverse)
    if (f.includes('format:video') || f.includes('video')) return 'video';
    if (f.includes('format:audio') || f.includes('audio')) return 'audio';
    if (f.includes('anc') || f.includes('vanc') || f.includes('smpte291'))
        return 'anc';

    return 'unknown';
}

/**
 * Prova a risolvere la categoria del sender:
 * - preferisci sender.format
 * - fallback su flow.format (più affidabile in alcuni ambienti)
 */
export function senderCategory(sender, flowsById) {
    const sFmt = sender?.format;
    let cat = categoryFromFormat(sFmt);
    if (cat !== 'unknown') return cat;

    const flowId = sender?.flow_id;
    if (flowId && flowsById?.[flowId]) {
        const fFmt = flowsById[flowId]?.format;
        cat = categoryFromFormat(fFmt);
        if (cat !== 'unknown') return cat;
    }

    // Ulteriore euristica: alcune implementazioni “marcano” ANC nella label
    const label = String(sender?.label || '').toLowerCase();
    if (label.includes('anc') || label.includes('vanc')) return 'anc';

    return 'unknown';
}

/**
 * Receiver: categorie ammesse
 * - prima prova receiver.format
 * - poi receiver.caps.format (string o array)
 * - se ancora nulla, ritorna Set(['unknown']) => non blocchiamo
 */
export function receiverAllowedCategories(receiver) {
    const rFmt = receiver?.format;
    let cat = categoryFromFormat(rFmt);
    if (cat !== 'unknown') {
        // Se il receiver dichiara "data", proviamo a capire se è ANC
        const label = String(receiver?.label || '').toLowerCase();
        if (cat === 'data' && (label.includes('anc') || label.includes('vanc')))
            cat = 'anc';
        return new Set([cat]);
    }

    const capsFormat = get(receiver, 'caps.format');
    if (Array.isArray(capsFormat)) {
        const set = new Set();
        capsFormat.forEach(x => {
            const c = categoryFromFormat(x);
            if (c !== 'unknown') set.add(c);
        });
        if (set.size) return set;
    } else if (typeof capsFormat === 'string') {
        cat = categoryFromFormat(capsFormat);
        if (cat !== 'unknown') return new Set([cat]);
    }

    // euristica su label (quando non c’è format/caps)
    const label = String(receiver?.label || '').toLowerCase();
    if (label.includes('audio')) return new Set(['audio']);
    if (label.includes('video')) return new Set(['video']);
    if (label.includes('anc') || label.includes('vanc'))
        return new Set(['anc']);

    return new Set(['unknown']);
}

/**
 * Verifica compatibilità sender -> receiver.
 * Regola:
 * - se non sappiamo (unknown), non blocchiamo (massima compatibilità)
 * - ANC è considerato compatibile con DATA se il receiver dichiara data (alcuni vendor fanno così)
 */
export function checkCompatibility(sender, receiver, flowsById) {
    const sCat = senderCategory(sender, flowsById);
    const rCats = receiverAllowedCategories(receiver);

    // Se non sappiamo, non blocchiamo
    if (sCat === 'unknown' || rCats.has('unknown')) {
        return {
            ok: true,
            reason: null,
            senderCat: sCat,
            receiverCats: [...rCats],
        };
    }

    // Special-case: ANC spesso passa come DATA
    if ((sCat === 'anc' && rCats.has('data')) || rCats.has('Data')) {
        return {
            ok: true,
            reason: null,
            senderCat: sCat,
            receiverCats: [...rCats],
        };
    }

    if (!rCats.has(sCat)) {
        return {
            ok: false,
            reason: `Formato non compatibile: sender=${sCat} → receiver accetta=${[...rCats].join(', ')}`,
            senderCat: sCat,
            receiverCats: [...rCats],
        };
    }

    return {
        ok: true,
        reason: null,
        senderCat: sCat,
        receiverCats: [...rCats],
    };
}
