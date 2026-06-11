require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool   = require('./pool');

async function seed() {
  console.log('🌱  Seeding database...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    /* USERS */
    const hash  = await bcrypt.hash('GVN@2024', 12);
    const admin = uuidv4(), mgr = uuidv4(), e1 = uuidv4(), e2 = uuidv4(), acc = uuidv4();

    const USERS = [
      [admin, 'Admin User',  'admin@gvndeveloper.com', hash, 'admin',            '9000000001'],
      [mgr,   'Amit Shah',   'amit@gvndeveloper.com',  hash, 'sales_manager',    '9000000004'],
      [e1,    'Priya Singh', 'priya@gvndeveloper.com', hash, 'sales_executive',  '9000000002'],
      [e2,    'Rahul Joshi', 'rahul@gvndeveloper.com', hash, 'sales_executive',  '9000000003'],
      [acc,   'Neha Kapoor', 'neha@gvndeveloper.com',  hash, 'accounts',         '9000000005'],
    ];
    for (const u of USERS) {
      await client.query(
        `INSERT INTO users(id,name,email,password_hash,role,phone)
         VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(email) DO NOTHING`, u);
    }

    /* INVENTORY */
    const UNITS = [
      ['A-101','A',1,'2 BHK',850, 1050,'East',      '1',4500000,'available'],
      ['A-201','A',2,'2 BHK',850, 1050,'East',      '1',4600000,'booked'   ],
      ['A-301','A',3,'3 BHK',1100,1350,'North',     '2',5800000,'available'],
      ['A-401','A',4,'2 BHK',860, 1060,'East',      '1',4700000,'available'],
      ['B-101','B',1,'2 BHK',870, 1070,'West',      '1',4400000,'sold'     ],
      ['B-201','B',2,'3 BHK',1120,1370,'South',     '2',5900000,'available'],
      ['B-301','B',3,'2 BHK',860, 1060,'East',      '1',4750000,'blocked'  ],
      ['B-401','B',4,'3 BHK',1130,1380,'North',     '2',6000000,'available'],
      ['C-101','C',1,'3 BHK',1150,1400,'North',     '2',6100000,'available'],
      ['C-201','C',2,'2 BHK',880, 1080,'West',      '1',4800000,'booked'   ],
      ['C-301','C',3,'4 BHK',1500,1800,'North-East','2',8500000,'available'],
      ['D-101','D',1,'2 BHK',860, 1060,'South',     '1',4350000,'sold'     ],
      ['D-201','D',2,'3 BHK',1110,1360,'East',      '2',5700000,'available'],
      ['D-301','D',3,'2 BHK',870, 1070,'North',     '1',4650000,'available'],
    ];
    const invId = {};
    for (const u of UNITS) {
      const id = uuidv4(); invId[u[0]] = id;
      await client.query(
        `INSERT INTO inventory(id,unit_number,wing,floor,property_type,carpet_area,
          builtup_area,facing,parking,base_price,status)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(unit_number) DO NOTHING`,
        [id, ...u]);
    }

    /* LEADS */
    const LEADS_DATA = [
      ['Rajesh','Sharma', '9876543210','rajesh@email.com', 'facebook',   'hot',            5000000,6000000,e1,  'Surat','Vesu'     ],
      ['Meera', 'Patel',  '9765432109','meera@email.com',  'magicbricks','visit_scheduled',4000000,5000000,e2,  'Surat','Adajan'   ],
      ['Vikram','Desai',  '9654321098','vikram@email.com', 'google_ads', 'booked',         6000000,7000000,e1,  'Surat','Pal'      ],
      ['Sunita','Joshi',  '9543210987','sunita@email.com', 'walk_in',    'interested',     3500000,4500000,e1,  'Surat','Katargam' ],
      ['Deepak','Mehta',  '9432109876','deepak@email.com', 'referral',   'warm',           5500000,6500000,e2,  'Surat','Vesu'     ],
      ['Kavita','Shah',   '9321098765','kavita@email.com', 'instagram',  'cold',           3000000,4000000,e1,  'Surat','Ghod Dod' ],
      ['Ankit', 'Parmar', '9210987654','ankit@email.com',  'justdial',   'new',            4500000,5500000,e1,  'Surat','Althan'   ],
      ['Pooja', 'Trivedi','9109876543','pooja@email.com',  'housing',    'negotiation',    6500000,7500000,e2,  'Surat','Vesu'     ],
      ['Manish','Kapoor', '9098765432','manish@email.com', 'broker',     'visit_completed',5000000,6000000,e1,  'Surat','Adajan'   ],
      ['Rekha', 'Gupta',  '8987654321','rekha@email.com',  'newspaper',  'contacted',      4000000,5000000,e1,  'Surat','Pal'      ],
      ['Suresh','Iyer',   '8876543210','suresh@email.com', 'referral',   'booked',         4000000,5000000,e2,  'Surat','Vesu'     ],
      ['Priya', 'Nair',   '8765432109','priya.n@email.com','google_ads', 'booked',         5000000,6000000,e1,  'Surat','Adajan'   ],
      ['Ananya','Rao',    '8654321098','ananya@email.com', 'facebook',   'interested',     3500000,4000000,e2,  'Surat','Althan'   ],
      ['Ramesh','Verma',  '8543210987','ramesh@email.com', 'walk_in',    'new',            4500000,5000000,e1,  'Surat','Katargam' ],
      ['Geeta', 'Singh',  '8432109876','geeta@email.com',  'magicbricks','hot',            5500000,6000000,e2,  'Surat','Pal'      ],
    ];
    const leadIds = [];
    for (const l of LEADS_DATA) {
      const id = uuidv4(); leadIds.push(id);
      await client.query(
        `INSERT INTO leads(id,first_name,last_name,mobile,email,source,status,
          budget_min,budget_max,assigned_to,city,area,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [id,...l,admin]);
    }

    /* CUSTOMERS */
    const CUSTS = [
      [leadIds[2], 'Vikram Desai', 'vikram@email.com', '9654321098','ABCDE1234F','1234-5678-9012','Surat','Gujarat'],
      [leadIds[10],'Suresh Iyer',  'suresh@email.com', '8876543210','FGHIJ5678K','2345-6789-0123','Surat','Gujarat'],
      [leadIds[11],'Priya Nair',   'priya.n@email.com','8765432109','KLMNO9012P','3456-7890-1234','Surat','Gujarat'],
    ];
    const custId = {};
    for (const c of CUSTS) {
      const id = uuidv4(); custId[c[1]] = id;
      await client.query(
        `INSERT INTO customers(id,lead_id,name,email,mobile,pan_number,aadhaar,city,state)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [id,...c]);
    }

    /* BOOKINGS */
    const bookId = {};
    const BOOKS = [
      ['Vikram Desai','A-201',500000,'Cheque',       false,'2024-05-15','confirmed' ],
      ['Priya Nair',  'C-201',600000,'RTGS',         true, '2024-05-20','confirmed' ],
      ['Suresh Iyer', 'B-101',450000,'Demand Draft', false,'2024-04-10','registered'],
    ];
    for (const b of BOOKS) {
      const id = uuidv4(); bookId[b[0]] = id;
      await client.query(
        `INSERT INTO bookings(id,customer_id,inventory_id,booking_amount,payment_mode,
          loan_required,booking_date,status,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, custId[b[0]], invId[b[1]], b[2], b[3], b[4], b[5], b[6], admin]);
    }

    /* PAYMENTS */
    const PAYS = [
      ['Vikram Desai','Booking Amount', 500000, '2024-05-15','2024-05-15','paid'   ],
      ['Vikram Desai','Installment 1', 1000000, '2024-07-15',null,        'pending'],
      ['Vikram Desai','Installment 2', 1000000, '2024-09-15',null,        'pending'],
      ['Priya Nair',  'Booking Amount', 600000, '2024-05-20','2024-05-20','paid'   ],
      ['Priya Nair',  'Installment 1', 1200000, '2024-07-20',null,        'pending'],
      ['Suresh Iyer', 'Booking Amount', 450000, '2024-04-10','2024-04-10','paid'   ],
      ['Suresh Iyer', 'Full Payment', 3950000,  '2024-05-10','2024-05-12','paid'   ],
    ];
    for (const p of PAYS) {
      await client.query(
        `INSERT INTO payments(id,booking_id,customer_id,payment_type,amount,
          due_date,received_date,status,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [uuidv4(), bookId[p[0]], custId[p[0]], p[1], p[2], p[3], p[4], p[5], admin]);
    }

    /* SITE VISITS */
    const SV = [
      [leadIds[1], 'Meera Patel',   '9765432109','2024-06-15','11:00',3,true, 'Adajan',  e2,'scheduled'  ],
      [leadIds[4], 'Deepak Mehta',  '9432109876','2024-06-10','10:00',4,false,'',        e2,'completed'  ],
      [leadIds[8], 'Manish Kapoor', '9098765432','2024-06-08','15:00',2,true, 'Adajan',  e1,'completed'  ],
      [leadIds[9], 'Rekha Gupta',   '8987654321','2024-06-18','12:00',3,false,'',        e1,'scheduled'  ],
      [leadIds[3], 'Sunita Joshi',  '9543210987','2024-06-05','11:30',5,true, 'Katargam',e1,'rescheduled'],
    ];
    for (const v of SV) {
      await client.query(
        `INSERT INTO site_visits(id,lead_id,customer_name,contact,visit_date,visit_time,
          family_count,pickup_required,pickup_location,assigned_to,status,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [uuidv4(),...v,admin]);
    }

    /* FOLLOW-UPS */
    for (let i = 0; i < 6; i++) {
      await client.query(
        `INSERT INTO followups(id,lead_id,followup_date,followup_time,notes,next_date,status,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [uuidv4(), leadIds[i], `2024-06-${10+i}`, '10:00:00',
         `Follow-up call – confirming interest for lead #${i+1}`,
         `2024-06-${17+i}`, 'pending', admin]);
    }

    /* BROKERS */
    await client.query(
      `INSERT INTO brokers(id,name,agency_name,mobile,email,rera_number,commission_pct)
       VALUES($1,'Ramesh Bhai','Surat Realty','9111111111','ramesh@surrealty.com','RERA-GJ-12345',2.0),
             ($2,'Sunil Mehta','Mehta Properties','9222222222','sunil@mehta.com','RERA-GJ-67890',1.5)`,
      [uuidv4(), uuidv4()]);

    /* TASKS */
    const TASKS = [
      ['Call Rajesh Sharma – confirm site visit',    'high',   e1,  '2024-06-12','pending'    ],
      ['Send agreement copy to Vikram Desai',         'medium', e1,  '2024-06-11','in_progress'],
      ['Follow up with Pooja Trivedi re negotiation', 'high',   e2,  '2024-06-10','completed'  ],
      ['Update Wing C inventory pricing',             'low',    admin,'2024-06-15','pending'   ],
      ['Collect PAN card copy from Priya Nair',       'medium', e1,  '2024-06-13','pending'    ],
      ['Prepare monthly sales report – June',         'high',   mgr, '2024-06-30','pending'    ],
    ];
    for (const t of TASKS) {
      await client.query(
        `INSERT INTO tasks(id,title,priority,assigned_to,due_date,status,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [uuidv4(),...t,admin]);
    }

    await client.query('COMMIT');

    console.log('\n✅  Seed complete!');
    console.log('─────────────────────────────────────────');
    console.log('  admin@gvndeveloper.com  / GVN@2024   (Admin)');
    console.log('  amit@gvndeveloper.com   / GVN@2024   (Sales Manager)');
    console.log('  priya@gvndeveloper.com  / GVN@2024   (Sales Executive)');
    console.log('  rahul@gvndeveloper.com  / GVN@2024   (Sales Executive)');
    console.log('  neha@gvndeveloper.com   / GVN@2024   (Accounts)');
    console.log('─────────────────────────────────────────\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
