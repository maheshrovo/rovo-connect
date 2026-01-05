# ROVO Connect - Defense Q&A Document

## Technical Reference Guide for Presentation Defense

---

## 1. PROTOCOL & COMMUNICATION QUESTIONS

### Q1.1: What protocols does ROVO Connect support?
**A:** We support all major industrial protocols through open-source, license-free libraries:
- **Modbus TCP/RTU** (pymodbus - BSD-3) - Universal PLC support
- **S7 Communication** (python-snap7 - LGPL) - Siemens native
- **FINS/UDP** (Custom/pyomron - MIT) - Omron native
- **EtherNet/IP** (pycomm3 - MIT) - Allen-Bradley/Rockwell
- **OPC-UA** (opcua-asyncio - LGPL) - Industry 4.0 universal
- **MQTT** (paho-mqtt - EPL-2.0) - Cloud/IoT integration

### Q1.2: Why Modbus? Isn't it old technology?
**A:** Modbus (1979) remains the most widely deployed industrial protocol because:
- **Universal support** - Every PLC brand supports it
- **Open standard** (IEC 61158) - No licensing costs
- **Simple & reliable** - Minimal overhead, easy debugging
- **Proven** - 45+ years of industrial use
- For advanced features, we also support OPC-UA and native protocols.

### Q1.3: What is the difference between Modbus TCP and RTU?
**A:** 
| Feature | Modbus TCP | Modbus RTU |
|---------|------------|------------|
| Physical | Ethernet | RS-485/RS-232 |
| Speed | 10/100/1000 Mbps | 9600-115200 bps |
| Cable Length | 100m (Cat5) | 1200m (RS-485) |
| Multi-drop | Via switch | Daisy-chain (32 devices) |
| Latency | ~2-10ms | ~10-50ms |

### Q1.4: Can you read/write to PLCs?
**A:** Yes. Modbus supports:
- **Read** - Holding Registers (FC 03), Input Registers (FC 04), Coils (FC 01), Discrete Inputs (FC 02)
- **Write** - Single Register (FC 06), Multiple Registers (FC 16), Single Coil (FC 05)

However, for safety, our monitoring solution is **read-only** by default. Write operations require explicit customer authorization.

### Q1.5: What about PROFINET?
**A:** PROFINET is Siemens' industrial Ethernet protocol. For Siemens PLCs, we use:
- **S7 Communication** (ISO-on-TCP) for data access - this is the standard method
- PROFINET is primarily for I/O level communication (drives, sensors), not for SCADA-level monitoring
- If customer has PROFINET devices, we interface through the PLC acting as the gateway

---

## 2. PERFORMANCE & SPEED QUESTIONS

### Q2.1: How fast can you poll data?
**A:**
| Mode | Cycle Time | Use Case |
|------|------------|----------|
| Real-Time | <50ms | Critical alarms, safety |
| Near Real-Time | 100-200ms | Production monitoring (default) |
| Standard | 500ms-1s | Energy, OEE calculation |

### Q2.2: How do you achieve <50ms latency?
**A:** Six key optimizations:
1. **asyncio** - Non-blocking I/O, no thread overhead
2. **Persistent connections** - No TCP handshake per request
3. **Batch reads** - Read 100 registers in 1 request vs 100 requests
4. **Connection pooling** - Pre-established sessions for each PLC
5. **Edge processing** - Zero cloud latency
6. **TCP optimization** - Disable Nagle's algorithm (TCP_NODELAY)

### Q2.3: How can you handle 2 lakh data points in 2 days?
**A:** Let's calculate:
```
Configuration: 20 PLCs × 100 tags × 1 second polling
Tags/second: 20 × 100 = 2,000
Tags/day: 2,000 × 86,400 = 172.8 million

2 lakh = 200,000 data points
Time needed: 200,000 / 2,000 = 100 seconds = 1.67 minutes

Result: We can collect 2 lakh data points in under 2 minutes, not 2 days.
```

### Q2.4: What limits the polling speed?
**A:** Several factors:
1. **PLC response time** - Each PLC has a minimum scan cycle (typically 5-20ms)
2. **Network latency** - Ethernet ~1-2ms, RS-485 ~10-50ms
3. **Register count** - More registers per request = longer response
4. **Number of PLCs** - Sequential polling adds up

**Practical limits:**
- Single PLC, 50 registers: ~20ms possible
- 10 PLCs, 50 registers each: ~200ms round-robin

### Q2.5: What is the data throughput?
**A:**
```
10 PLCs × 50 registers × 2 bytes × 10 Hz = 10 KB/s
Gigabit Ethernet capacity: 125 MB/s
Utilization: 0.008%
```
Network is never the bottleneck.

---

## 3. NON-ETHERNET PLC QUESTIONS

### Q3.1: What if the PLC doesn't have Ethernet?
**A:** We fully support serial PLCs through:
1. **USB-to-RS485 adapters** (recommended) - FTDI chipset, kernel-native drivers
2. **USB-to-RS232 adapters** - For legacy equipment
3. **Serial-to-Ethernet gateways** - Moxa NPort, Advantech EKI

### Q3.2: Why do you recommend FTDI chipset?
**A:** 
- **Kernel-native drivers** - Built into Linux kernel, no third-party software
- **Industrial proven** - 20+ years in industrial applications
- **No licensing** - Open driver, no vendor dependency
- **Reliable** - Better than cheap CH340/PL2303 clones

### Q3.3: How many serial PLCs can one Edge device handle?
**A:** Using USB-RS485 hubs:
- **4-port hub**: 4 PLCs (RS-485 can daisy-chain 32 per bus)
- **8-port hub**: 8 PLCs
- Total capacity with daisy-chaining: Potentially 256 devices (8 buses × 32 devices)

### Q3.4: What is the latency for serial communication?
**A:**
| Baud Rate | 50 registers | Latency |
|-----------|--------------|---------|
| 9600 bps | 100 bytes | ~100ms |
| 19200 bps | 100 bytes | ~50ms |
| 115200 bps | 100 bytes | ~10ms |

Serial is slower than Ethernet, but adequate for most monitoring.

---

## 4. VENDOR-LOCKED PLC QUESTIONS

### Q4.1: What if vendor doesn't share register addresses?
**A:** We have 4 strategies:

1. **Protocol Analysis** - Capture and analyze HMI↔PLC traffic
2. **OPC-UA Bridge** - Request OPC-UA access (often provided freely)
3. **SCADA Integration** - Connect to their existing SCADA/historian
4. **External I/O** - Current transformers, proximity sensors

### Q4.2: How does packet sniffing work?
**A:** Step-by-step process:
1. Set up a **mirror port** on the network switch
2. Capture traffic using **Wireshark/tcpdump** for 30 minutes
3. Filter by protocol (e.g., `modbus or tcp.port==502`)
4. Analyze **Function Codes** (FC 03 = Read Holding Registers)
5. Identify register addresses from existing HMI communication
6. Correlate values with physical machine state
7. Document tag mapping

### Q4.3: Is packet sniffing legal?
**A:** Yes, when:
- Performed on **customer's own network**
- With **customer authorization**
- For **integration purposes**
This is standard practice in industrial system integration.

### Q4.4: What if there's no existing HMI to analyze?
**A:** Options:
1. **Register scanning** - Read all registers sequentially, identify patterns
2. **Physical correlation** - Manually operate machine, observe register changes
3. **OPC-UA discovery** - If available, provides automatic tag browsing
4. **Vendor negotiation** - Request documentation with NDA

### Q4.5: What about encrypted PLC protocols?
**A:** Most industrial protocols are unencrypted (designed for isolated networks). If encryption exists:
- Use **OPC-UA** with security (supports certificates)
- Request **API access** from vendor
- Integrate via **database** if SCADA stores data

---

## 5. SECURITY QUESTIONS

### Q5.1: How do you secure Edge-to-Cloud communication?
**A:** Defense-in-depth approach:
1. **TLS 1.3** - All HTTP/WebSocket traffic encrypted
2. **WireGuard VPN** - Kernel-native, open-source tunnel
3. **Certificate pinning** - Prevent MITM attacks
4. **Mutual TLS** - Both Edge and Cloud authenticate each other

### Q5.2: Why WireGuard instead of OpenVPN?
**A:**
| Feature | WireGuard | OpenVPN |
|---------|-----------|---------|
| Code size | 4,000 lines | 100,000+ lines |
| Speed | Native kernel | Userspace |
| CPU usage | Lower | Higher |
| Setup | Simple | Complex |
| Security | ChaCha20, Curve25519 | OpenSSL |

WireGuard is simpler, faster, and more secure.

### Q5.3: How is the Edge device secured?
**A:**
- **SSH key-only access** - No password authentication
- **Firewall** - Only required ports open (502 for Modbus, VPN)
- **Secure boot** - Raspberry Pi secure boot enabled
- **Encrypted storage** - AES-256 for TimescaleDB
- **Automatic updates** - Security patches via apt

### Q5.4: What about PLC network security?
**A:**
- **Network isolation** - PLC network on separate VLAN
- **No direct internet** - Edge is the only gateway
- **Read-only by default** - No write commands to PLCs
- **Audit logging** - All access attempts recorded

### Q5.5: What happens if the Edge device is compromised?
**A:** Layered protection:
1. **Limited access** - Edge can only read from PLCs
2. **No write capability** - Cannot modify PLC programs
3. **VPN termination** - Revoking VPN key disconnects Edge
4. **Monitoring** - Anomaly detection on Cloud side
5. **Physical security** - Edge in locked industrial cabinet

---

## 6. DATABASE & STORAGE QUESTIONS

### Q6.1: Why TimescaleDB?
**A:**
- **Time-series optimized** - Built for sensor data
- **PostgreSQL based** - Standard SQL, familiar tools
- **90%+ compression** - Automatic columnar compression
- **Open-source** - Apache 2.0 license (community edition)
- **Lightweight** - Runs on Raspberry Pi

### Q6.2: How do you achieve 90% compression?
**A:** TimescaleDB uses:
1. **Columnar storage** - Similar values compressed together
2. **Delta encoding** - Store differences, not absolute values
3. **Dictionary encoding** - Repeating strings stored once
4. **Run-length encoding** - Consecutive same values compressed

Example: 1,000,000 rows × 50 bytes = 50 MB → Compressed to ~5 MB

### Q6.3: How long can you store historical data?
**A:** Configurable based on storage:
- **256GB NVMe**: ~2-5 years (with compression)
- **Tiered storage**: Hot (SSD) / Cold (HDD) / Archive (cloud)
- **Continuous aggregation**: Store min/max/avg per minute for old data

### Q6.4: What happens when storage is full?
**A:**
1. **Automatic alerting** - Notify before 90% capacity
2. **Data tiering** - Move old data to cheaper storage
3. **Selective retention** - Keep aggregated data, delete raw
4. **Cloud sync** - Push historical data to cloud storage

### Q6.5: How do you handle offline mode?
**A:**
- **7-day local buffer** - Edge stores data even without cloud connection
- **Automatic sync** - Upload when connection restored
- **Conflict resolution** - Timestamp-based ordering
- **Priority queues** - Alerts synced first

---

## 7. SCALABILITY QUESTIONS

### Q7.1: How many PLCs can one Edge device handle?
**A:**
| Hardware | Max PLCs | Max Tags | Cycle Time |
|----------|----------|----------|------------|
| Raspberry Pi 5 (16GB) | 8-12 | 1,000-1,500 | 100-200ms |
| Industrial ARM (8GB) | 15-20 | 2,000-3,000 | 100ms |
| x86 Industrial PC (32GB) | 25-40 | 5,000+ | 50-100ms |

### Q7.2: What limits the PLC count?
**A:** Multiple factors:
1. **Memory** - Each connection uses ~50-100MB RAM
2. **CPU** - Async processing, but overhead per PLC
3. **Network ports** - Ethernet switch capacity
4. **Polling time** - Sequential polling adds latency

### Q7.3: How do you scale for large factories?
**A:** **Horizontal scaling** - Deploy multiple Edge devices:
- **Zone 1**: Edge #1 handles Line 1 (10 PLCs)
- **Zone 2**: Edge #2 handles Line 2 (10 PLCs)
- All Edge devices report to same Cloud dashboard

### Q7.4: What hardware is needed for multi-PLC setup?
**A:**
- **Ethernet PLCs**: 8/16/24-port Industrial Managed Switch
- **Serial PLCs**: USB-RS485 Hub (4/8 port, FTDI)
- **Power**: Industrial 24V DC DIN-rail supply
- **Enclosure**: IP65-rated industrial cabinet

---

## 8. DASHBOARD & FRONTEND QUESTIONS

### Q8.1: Why WebSocket instead of Server-Sent Events?
**A:**
| Feature | WebSocket | SSE |
|---------|-----------|-----|
| Direction | Bidirectional | Server→Client only |
| Binary data | Yes | Text only |
| Control commands | Yes | Needs separate HTTP |
| Connection overhead | Single | Single |
| Browser support | Universal | Universal |

WebSocket allows dashboard to send commands (acknowledge alarms, etc.)

### Q8.2: What is the dashboard refresh rate?
**A:** <100ms for:
- Real-time data updates
- Chart animations
- Status indicators

Actual data refresh depends on Edge polling cycle (100-500ms).

### Q8.3: Is the dashboard mobile-responsive?
**A:** Yes:
- **Progressive Web App (PWA)** - Install on phone like native app
- **Responsive design** - Works on any screen size
- **Offline support** - View cached data without connection

### Q8.4: How do you handle multiple users?
**A:**
- **Role-based access control (RBAC)**:
  - Admin: Full access, configuration
  - Operator: View + acknowledge alarms
  - Viewer: View only
- **Multi-tenant**: Each customer sees only their data
- **Audit trail**: All actions logged

---

## 9. EDGE COMPUTING QUESTIONS

### Q9.1: Why process data at Edge instead of Cloud?
**A:**
1. **Zero latency** - No internet round-trip (50ms vs 200ms+)
2. **Offline operation** - Works without internet
3. **Bandwidth savings** - Only aggregated data sent (95% reduction)
4. **Data sovereignty** - Sensitive data stays on-premise
5. **Reliability** - Factory operates even if cloud is down

### Q9.2: What processing happens at Edge?
**A:**
- **Tag normalization** - Convert raw values to engineering units
- **Scaling** - Apply multipliers (e.g., 0.1 for temperature)
- **Aggregation** - Calculate min/max/avg per minute
- **Alert detection** - Threshold monitoring locally
- **OEE calculation** - Real-time efficiency metrics
- **Delta compression** - Only store changed values

### Q9.3: What if Edge device fails?
**A:**
- **Watchdog timer** - Automatic reboot on hang
- **Systemd service** - Auto-restart application on crash
- **Redundancy option** - Hot standby Edge (enterprise)
- **Cloud alerting** - Notify if Edge goes offline

---

## 10. INDUSTRY STANDARDS QUESTIONS

### Q10.1: What standards does ROVO Connect comply with?
**A:**
| Standard | Description | Status |
|----------|-------------|--------|
| IEC 61158 | Modbus protocol | ✓ Compliant |
| IEC 62541 | OPC-UA | ✓ Supported |
| OASIS MQTT | IoT messaging | ✓ Supported |
| RFC 8446 | TLS 1.3 | ✓ Implemented |
| IEC 62443 | Industrial cybersecurity | ✓ Designed for |
| ISA-95 | Enterprise integration | ✓ Compatible |

### Q10.2: Why open-source libraries?
**A:**
1. **No vendor lock-in** - Switch libraries if needed
2. **No licensing costs** - BSD/MIT/LGPL compatible
3. **Security auditable** - Source code is public
4. **Community maintained** - Continuous improvements
5. **Proven** - Used by thousands of industrial deployments

### Q10.3: What about proprietary protocols?
**A:** We avoid proprietary protocols because:
- **Licensing fees** - Increase cost
- **Vendor dependency** - Risk of discontinuation
- **Limited support** - Community can't help

If proprietary is required, we use **OPC-UA** as a bridge (most vendors provide OPC-UA servers).

---

## 11. IMPLEMENTATION QUESTIONS

### Q11.1: How long does installation take?
**A:** Typical timeline:
- **Day 1**: Site survey, network setup
- **Day 2**: Edge deployment, PLC connections
- **Day 3**: Tag configuration, testing
- **Day 4**: Dashboard setup, training
- **Total**: 3-5 days for a typical factory

### Q11.2: What if I have 50 different PLC models?
**A:**
- All support **Modbus** - Use common protocol
- Create **tag mapping** for each model once
- **Template-based** configuration for similar PLCs
- Edge handles protocol translation transparently

### Q11.3: Do you need to modify PLC programs?
**A:** **No.** We only **read** data from existing registers. No changes to PLC logic.

If Modbus is not enabled:
- **Enable Modbus** on PLC (usually a setting change)
- No program modification required

### Q11.4: What happens during a network failure?
**A:**
1. **Edge continues collecting** - Local TimescaleDB stores data
2. **Buffer for 7 days** - No data loss for a week
3. **Auto-reconnect** - Monitors connection, retries automatically
4. **Sync on restore** - Uploads buffered data when online

---

## 12. COMPETITIVE QUESTIONS

### Q12.1: How are you different from commercial SCADA?
**A:**
| Feature | ROVO Connect | Commercial SCADA |
|---------|--------------|------------------|
| License cost | Open-source | $10,000+ per server |
| Multi-vendor | Universal | Often vendor-specific |
| Cloud-native | Yes | Usually on-premise |
| Mobile app | PWA included | Extra cost |
| Setup time | Days | Weeks-months |

### Q12.2: What about existing solutions like Ignition, Wonderware?
**A:** 
- **Ignition**: Excellent but $$$$ licensing (per client, per module)
- **Wonderware**: Enterprise-grade but complex, expensive
- **ROVO Connect**: 
  - **80% of features at 20% cost**
  - **Modern tech stack** (React, WebSocket, TimescaleDB)
  - **Cloud-native** from day one

### Q12.3: Why should we trust a new product?
**A:**
1. **Open-source foundations** - pymodbus, snap7, TimescaleDB are proven
2. **Working code** - We've demonstrated communication with 4 PLC brands
3. **No lock-in** - If we fail, you keep the data (PostgreSQL standard)
4. **Iterative delivery** - Start small, validate, then expand

---

## QUICK REFERENCE CARD

### Communication Formulas
```
Polling rate = 1 / cycle_time (Hz)
Tags/second = num_PLCs × tags_per_PLC × polling_rate
Data/day = Tags/second × 86400
```

### Modbus Register Types
```
Coil (M0): address 0-65535, boolean
Discrete: address 0-65535, boolean (read-only)
Input: address 0-65535, 16-bit (read-only)
Holding (D0): address 0-65535, 16-bit
```

### PLC Address Mapping
```
Mitsubishi FX5U: D0=0, M0=8192
Delta DVP: D0=4096, M0=2048
Omron CP2E: D0=0, M0=CIO
Siemens S7: DB blocks, memory areas
```

### Data Capacity
```
2 lakh = 200,000 data points
At 2,000 tags/second: 100 seconds = 1.67 minutes
Daily capacity: 172 million+ data points
```

---

*Document Version: 1.0 | Last Updated: January 2026*
