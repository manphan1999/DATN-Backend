import { exec, spawn } from 'child_process';

const CONN = 'ens33';

const run = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) return reject(stderr || err.message);
            resolve(stdout.trim());
        });
    });
};

const getConnectionByDevice = async () => {
    const out = await run(`nmcli -t -f GENERAL.CONNECTION device show ${CONN}`);
    return out.split(':')[1].trim();
};

const prefixToMask = (prefix) => {
    prefix = parseInt(prefix, 10);
    if (isNaN(prefix)) return '';

    return Array(4)
        .fill(0)
        .map((_, i) => {
            const bits = Math.max(0, Math.min(8, prefix - i * 8));
            return bits === 0 ? 0 : 256 - (1 << (8 - bits));
        })
        .join('.');
};

const maskToPrefix = (mask) => {
    if (!mask) return 24;

    return mask
        .split('.')
        .map(o => parseInt(o).toString(2).padStart(8, '0'))
        .join('')
        .replace(/0/g, '').length;
};

const isValidIPv4 = (ip) => {
    if (typeof ip !== 'string') return false;

    const parts = ip.trim().split('.');
    if (parts.length !== 4) return false;

    return parts.every(p => {
        if (!/^\d+$/.test(p)) return false;
        const n = Number(p);
        return n >= 0 && n <= 255;
    });
};

const isValidSubnet = (mask) => {
    if (!isValidIPv4(mask)) return false;

    const bin = mask
        .split('.')
        .map(o => Number(o).toString(2).padStart(8, '0'))
        .join('');
    return /^1+0+$/.test(bin);
};

const isValidDNS = (dns) => {
    if (!dns) return true;

    return dns.split(',')
        .map(s => s.trim())
        .every(isValidIPv4);
};

const networkInfo = async () => {
    const conn = await getConnectionByDevice(CONN);

    const ipRaw = await run(`nmcli -g ipv4.addresses con show "${conn}"`);
    const gw = await run(`nmcli -g ipv4.gateway con show "${conn}"`);
    const dns = await run(`nmcli -g ipv4.dns con show "${conn}"`);

    let ip = '';
    let subnet = '';

    if (ipRaw) {
        const [addr, prefix] = ipRaw.split('/');
        ip = addr;
        subnet = prefixToMask(prefix);
    }

    return {
        ip,
        subnet,
        gateway: gw,
        dns
    };
};

const setManual = async ({ ip, subnet, gateway, dns }) => {
    try {

    } catch (error) {

    }
    const conn = await getConnectionByDevice();

    if (!ip || !gateway || !subnet) {
        throw new Error('Thiếu IP, Gateway hoặc Subnet');
    }

    if (!isValidIPv4(ip)) {
        throw new Error('IP không hợp lệ');
    }

    if (!isValidSubnet(subnet)) {
        throw new Error('Subnet mask không hợp lệ');
    }

    if (!isValidIPv4(gateway)) {
        throw new Error('Gateway không hợp lệ');
    }

    if (!isValidDNS(dns)) {
        throw new Error('DNS không hợp lệ');
    }

    const prefix = subnet ? maskToPrefix(subnet) : 24;
    const dnsValue = dns || '';

    await run(
        `nmcli con mod "${conn}" ` +
        `ipv4.method manual ` +
        `ipv4.addresses ${ip}/${prefix} ` +
        `ipv4.gateway ${gateway} ` +
        `ipv4.dns "${dnsValue}"`
    );

    await run(`nmcli con up "${conn}"`);

    return {
        CONN,
        ip,
        subnet: subnet,
        gateway,
        dns: dnsValue
    };
};

const rebootDevice = () => {
    spawn('sudo', ['/usr/bin/systemctl', 'reboot'], {
        detached: true,
        stdio: 'ignore'
    }).unref();
};

module.exports = { networkInfo, setManual, rebootDevice }