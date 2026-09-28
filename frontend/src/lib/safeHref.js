export const safeHref = value => typeof value === 'string' && !/[\\\u0000-\u0020]/.test(value) && (/^\/(?!\/)/.test(value) || /^(https:\/\/|mailto:|tel:|#)/.test(value)) ? value : '';
