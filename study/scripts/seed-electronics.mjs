/**
 * seed-electronics.mjs
 *
 * Seeds the "Electronics & Embedded Systems" roadmap into Supabase.
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from
 * .env.local — no service_role key needed, anon key + open RLS is enough.
 *
 * Run from the study/ directory:
 *   node scripts/seed-electronics.mjs
 *
 * Safe to re-run: checks for an existing roadmap with the same name first.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

// ─── Read .env.local ─────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')

let supabaseUrl, supabaseKey
try {
  const envText = readFileSync(envPath, 'utf8')
  const envVars = Object.fromEntries(
    envText
      .split(/\r?\n/)
      .filter(line => line.includes('=') && !line.startsWith('#'))
      .map(line => {
        const idx = line.indexOf('=')
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
      })
  )
  supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
  supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']
} catch {
  console.error('❌ Could not read .env.local — make sure you run this from study/')
  process.exit(1)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing from .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Roadmap data ─────────────────────────────────────────────────────────────

const ROADMAP = {
  name: 'Electronics & Embedded Systems',
  color: '#4ade80',
  description: 'From absolute beginner in electronics to designing, programming, debugging, and building real-world embedded systems.',
}

const STAGES = [
  {
    title: 'Stage 1 — Electronics Fundamentals',
    timeframe_label: 'Week 1–3',
    topics: [
      { title: 'Voltage',                                                          category: 'theory'    },
      { title: 'Current',                                                          category: 'theory'    },
      { title: 'Resistance',                                                       category: 'theory'    },
      { title: "Ohm's Law",                                                        category: 'theory'    },
      { title: 'Electrical power',                                                 category: 'theory'    },
      { title: 'Power calculations',                                               category: 'theory'    },
      { title: 'Series circuits',                                                  category: 'theory'    },
      { title: 'Parallel circuits',                                                category: 'theory'    },
      { title: "Kirchhoff's Current Law",                                          category: 'theory'    },
      { title: "Kirchhoff's Voltage Law",                                          category: 'theory'    },
      { title: 'Basic electrical safety',                                          category: 'theory'    },
      { title: 'Build simple breadboard circuits with battery, resistors, LEDs, wires', category: 'practical' },
    ],
  },
  {
    title: 'Stage 2 — Electronic Components',
    timeframe_label: 'Week 3–5',
    topics: [
      { title: 'Resistors',                     category: 'theory'    },
      { title: 'Capacitors',                    category: 'theory'    },
      { title: 'Inductors',                     category: 'theory'    },
      { title: 'Diodes',                        category: 'theory'    },
      { title: 'LEDs',                          category: 'theory'    },
      { title: 'BJT transistors',               category: 'theory'    },
      { title: 'MOSFETs',                       category: 'theory'    },
      { title: 'Relays',                        category: 'theory'    },
      { title: 'Voltage regulators',            category: 'theory'    },
      { title: 'LED + resistor circuit',        category: 'practical' },
      { title: 'Capacitor charging/discharging',category: 'practical' },
      { title: 'Diode protection circuit',      category: 'practical' },
      { title: 'Transistor as a switch',        category: 'practical' },
      { title: 'MOSFET controlling a load',     category: 'practical' },
      { title: 'Relay switching a device',      category: 'practical' },
      { title: 'Voltage regulator circuit',     category: 'practical' },
    ],
  },
  {
    title: 'Stage 3 — Arduino & Embedded Programming',
    timeframe_label: 'Month 2',
    topics: [
      { title: 'Arduino board structure',                              category: 'theory'    },
      { title: 'GPIO',                                                 category: 'theory'    },
      { title: 'Digital input',                                        category: 'theory'    },
      { title: 'Digital output',                                       category: 'theory'    },
      { title: 'Analog input',                                         category: 'theory'    },
      { title: 'PWM',                                                  category: 'theory'    },
      { title: 'Serial communication',                                 category: 'theory'    },
      { title: 'Sensors',                                              category: 'theory'    },
      { title: 'Actuators',                                            category: 'theory'    },
      { title: 'Project: LED',                                         category: 'practical' },
      { title: 'Project: button-controlled LED',                       category: 'practical' },
      { title: 'Project: potentiometer-controlled brightness',         category: 'practical' },
      { title: 'Project: buzzer',                                      category: 'practical' },
      { title: 'Project: ultrasonic distance sensor',                  category: 'practical' },
      { title: 'Project: servo motor',                                 category: 'practical' },
      { title: 'Project: LCD sensor display',                          category: 'practical' },
    ],
  },
  {
    title: 'Stage 4 — C/C++ for Embedded Systems',
    timeframe_label: 'Month 2–3',
    topics: [
      { title: 'Variables',                                                          category: 'theory'    },
      { title: 'Data types',                                                         category: 'theory'    },
      { title: 'Operators',                                                          category: 'theory'    },
      { title: 'Conditions',                                                         category: 'theory'    },
      { title: 'Loops',                                                              category: 'theory'    },
      { title: 'Functions',                                                          category: 'theory'    },
      { title: 'Arrays',                                                             category: 'theory'    },
      { title: 'Strings',                                                            category: 'theory'    },
      { title: 'Structs',                                                            category: 'theory'    },
      { title: 'Pointers',                                                           category: 'theory'    },
      { title: 'References',                                                         category: 'theory'    },
      { title: 'Classes',                                                            category: 'theory'    },
      { title: 'Basic OOP',                                                          category: 'theory'    },
      { title: 'Memory management',                                                  category: 'theory'    },
      { title: 'Registers',                                                          category: 'theory'    },
      { title: 'Stack vs heap',                                                      category: 'theory'    },
      { title: 'Interrupts',                                                         category: 'theory'    },
      { title: 'Timers',                                                             category: 'theory'    },
      { title: 'Revisit earlier Arduino projects and explain the underlying code',   category: 'practical' },
    ],
  },
  {
    title: 'Stage 5 — Communication Protocols',
    timeframe_label: 'Month 3',
    topics: [
      { title: 'UART',                                      category: 'theory'    },
      { title: 'I2C',                                       category: 'theory'    },
      { title: 'SPI',                                       category: 'theory'    },
      { title: 'CAN',                                       category: 'theory'    },
      { title: 'USB basics',                                category: 'theory'    },
      { title: 'Arduino → PC via UART',                    category: 'practical' },
      { title: 'Arduino → sensor via I2C',                 category: 'practical' },
      { title: 'Arduino → display via I2C/SPI',            category: 'practical' },
      { title: 'Arduino → external module via SPI',        category: 'practical' },
      { title: 'Experiment with CAN',                      category: 'practical' },
    ],
  },
  {
    title: 'Stage 6 — ESP32',
    timeframe_label: 'Month 3–4',
    topics: [
      { title: 'ESP32 architecture',                        category: 'theory'    },
      { title: 'Wi-Fi',                                     category: 'theory'    },
      { title: 'Bluetooth',                                 category: 'theory'    },
      { title: 'Deep sleep',                                category: 'theory'    },
      { title: 'Power management',                          category: 'theory'    },
      { title: 'Project: IoT sensor over Wi-Fi',            category: 'practical' },
      { title: 'Project: web server',                       category: 'practical' },
      { title: 'Project: home automation',                  category: 'practical' },
      { title: 'Project: Bluetooth device',                 category: 'practical' },
      { title: 'Project: remote monitoring dashboard',      category: 'practical' },
    ],
  },
  {
    title: 'Stage 7 — PCB Design',
    timeframe_label: 'Month 4',
    topics: [
      { title: 'Schematic design',                                                   category: 'theory'    },
      { title: 'PCB layout',                                                         category: 'theory'    },
      { title: 'Footprints',                                                         category: 'theory'    },
      { title: 'Routing',                                                            category: 'theory'    },
      { title: 'Ground planes',                                                      category: 'theory'    },
      { title: 'DRC',                                                                category: 'theory'    },
      { title: 'Gerber files',                                                       category: 'theory'    },
      { title: 'Convert a breadboard project into a manufactured PCB, start to finish', category: 'practical' },
    ],
  },
  {
    title: 'Stage 8 — Power Electronics',
    timeframe_label: 'Month 4–5',
    topics: [
      { title: 'Buck converters',                     category: 'theory'    },
      { title: 'Boost converters',                    category: 'theory'    },
      { title: 'Buck-boost converters',               category: 'theory'    },
      { title: 'Batteries: Li-ion/LiPo/LiFePO4',     category: 'theory'    },
      { title: 'Battery Management Systems',          category: 'theory'    },
      { title: 'Solar charging',                      category: 'theory'    },
      { title: 'Battery-powered ESP32',               category: 'practical' },
      { title: 'Solar data logger',                   category: 'practical' },
      { title: 'Battery monitoring system',           category: 'practical' },
    ],
  },
  {
    title: 'Stage 9 — Raspberry Pi & Linux',
    timeframe_label: 'Month 5',
    topics: [
      { title: 'Linux basics',                                    category: 'theory'    },
      { title: 'Python',                                          category: 'theory'    },
      { title: 'MQTT',                                            category: 'theory'    },
      { title: 'Flask',                                           category: 'theory'    },
      { title: 'Docker',                                          category: 'theory'    },
      { title: 'Raspberry Pi security camera',                    category: 'practical' },
      { title: 'Computer vision system',                          category: 'practical' },
      { title: 'MQTT home automation',                            category: 'practical' },
      { title: 'Raspberry Pi + ESP32 combined system',            category: 'practical' },
    ],
  },
  {
    title: 'Stage 10 — Real Projects',
    timeframe_label: 'Month 5–6+',
    topics: [
      { title: 'Weather station',         category: 'practical' },
      { title: 'Smart door lock',         category: 'practical' },
      { title: 'Energy monitoring system',category: 'practical' },
      { title: 'Robot car',               category: 'practical' },
      { title: 'Smart irrigation',        category: 'practical' },
      { title: 'Voice assistant',         category: 'practical' },
      { title: 'Security camera',         category: 'practical' },
      { title: 'Solar data logger',       category: 'practical' },
      { title: 'Home automation hub',     category: 'practical' },
    ],
  },
  {
    title: 'Stage 11 — Debugging',
    timeframe_label: 'Ongoing throughout',
    topics: [
      { title: 'Multimeter',                   category: 'practical' },
      { title: 'Oscilloscope',                 category: 'practical' },
      { title: 'Logic analyzer',               category: 'practical' },
      { title: 'Systematic debugging process', category: 'theory'    },
    ],
  },
  {
    title: 'Stage 12 — Documentation & Sharing',
    timeframe_label: 'Ongoing throughout',
    topics: [
      { title: "Document each project's build, code, and lessons learned", category: 'practical' },
      { title: 'Publish projects (GitHub, blog, etc.)',                    category: 'practical' },
    ],
  },
]

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding Electronics & Embedded Systems roadmap…\n')

  // Guard: don't double-insert
  const { data: existing } = await supabase
    .from('roadmaps')
    .select('id, name')
    .eq('name', ROADMAP.name)
    .maybeSingle()

  if (existing) {
    console.log(`⚠️  Roadmap "${ROADMAP.name}" already exists (id: ${existing.id}).`)
    console.log('   Delete it from the Admin UI first if you want to re-seed.\n')
    process.exit(0)
  }

  // 1. Insert roadmap
  const { data: roadmap, error: rmErr } = await supabase
    .from('roadmaps')
    .insert(ROADMAP)
    .select()
    .single()

  if (rmErr || !roadmap) {
    console.error('❌ Failed to insert roadmap:', rmErr?.message)
    process.exit(1)
  }
  console.log(`✅ Created roadmap: "${roadmap.name}" (${roadmap.id})\n`)

  // 2. Insert stages + topics
  let totalTopics = 0

  for (let si = 0; si < STAGES.length; si++) {
    const stageData = STAGES[si]

    const { data: stage, error: stErr } = await supabase
      .from('stages')
      .insert({
        roadmap_id:      roadmap.id,
        title:           stageData.title,
        timeframe_label: stageData.timeframe_label,
        order_index:     si,
      })
      .select()
      .single()

    if (stErr || !stage) {
      console.error(`❌ Failed to insert stage ${si + 1}:`, stErr?.message)
      continue
    }

    // Insert topics for this stage
    const topicRows = stageData.topics.map((t, ti) => ({
      stage_id:    stage.id,
      title:       t.title,
      category:    t.category,
      order_index: ti,
      is_done:     false,
    }))

    const { error: tErr } = await supabase.from('topics').insert(topicRows)
    if (tErr) {
      console.error(`  ❌ Failed to insert topics for stage ${si + 1}:`, tErr.message)
    } else {
      console.log(`  ✅ Stage ${si + 1}: "${stageData.title}" — ${topicRows.length} topics`)
      totalTopics += topicRows.length
    }
  }

  console.log(`\n✨ Done! Seeded ${STAGES.length} stages and ${totalTopics} topics.`)
  console.log(`   Open /admin in the app to see and edit the roadmap.\n`)
}

seed().catch(err => {
  console.error('❌ Unexpected error:', err)
  process.exit(1)
})
