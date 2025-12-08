import os from 'os';
import fs from 'fs';
import { execSync } from "child_process";

const checkMode = (iface) => {
    try {
        const path = `/etc/NetworkManager/system-connections/`;
        const files = fs.readdirSync(path).filter(f => f.endsWith('.nmconnection'));

        for (const file of files) {
            const content = fs.readFileSync(path + file, 'utf8');

            // Kiểm tra đúng interface
            if (!content.includes(`interface-name=${iface}`)) continue;

            // Nếu có [ipv4] method=auto thì DHCP
            if (/^\[ipv4\][\s\S]*?method=auto/m.test(content)) {
                return "DHCP";
            }

            // Nếu có method=manual thì Static IP
            if (/^\[ipv4\][\s\S]*?method=manual/m.test(content)) {
                return "Static IP";
            }
        }

        return "unknown";
    } catch (e) {
        return "unknown";
    }
};
// const checkMode = () => {
//     try {
//         const config = fs.readFileSync('/etc/dhcpcd.conf', 'utf8');

//         // kiểm tra static theo interface
//         if (/static ip_address=/i.test(config)) {
//             return "Static IP";
//         }

//         return "DHCP";
//     } catch {
//         return "unknown";
//     }
// };

const networkInfo = () => {
    const nets = os.networkInterfaces();
    const result = {};
    const mode = checkMode();   // <--- đọc trạng thái

    for (const name in nets) {
        const net = nets[name].find(i => i.family === "IPv4" && !i.internal);
        if (net) {
            result[name] = {
                mode: checkMode(name),              // static | dhcp
                ip: net.address,
                netmask: net.netmask,
                mac: net.mac,
                gateway: getGateway(),
                dns: getDNS()
            };
        }
    }
    return result;
};

const getDNS = () => {
    try {
        let dns = [];

        // 1. Đọc DNS thật từ systemd nếu có
        if (fs.existsSync('/run/systemd/resolve/resolv.conf')) {
            const real = fs.readFileSync('/run/systemd/resolve/resolv.conf', 'utf8');
            dns = real
                .split('\n')
                .filter(l => l.startsWith('nameserver'))
                .map(l => l.split(' ')[1].trim());
            if (dns.length) return dns;
        }

        // 2. fallback đọc từ /etc/resolv.conf
        const text = fs.readFileSync('/etc/resolv.conf', 'utf8');
        dns = text
            .split('\n')
            .filter(l => l.startsWith('nameserver'))
            .map(l => l.split(' ')[1].trim());

        return dns;
    } catch {
        return [];
    }
}

const getGateway = () => {
    try {
        const output = execSync("ip route show default").toString();
        return output.match(/default via ([0-9.]+)/)?.[1] || null;
    } catch { return null }
}

module.exports = { checkMode, networkInfo, getDNS, getGateway }
