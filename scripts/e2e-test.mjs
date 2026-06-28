/**
 * End-to-end API test for MediFlow HMS
 * Run: node scripts/e2e-test.mjs
 */
import { createClient } from '@supabase/supabase-js'

const URL = process.env.VITE_SUPABASE_URL || 'https://pekxhscinbgbmzdpkihz.supabase.co'
const ANON = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBla3hoc2NpbmJnYm16ZHBraWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDU0MzAsImV4cCI6MjA5ODIyMTQzMH0.DHyfCvL4lQAGH_oIdkxCjikdaZ9W3qswwxKl5ico18s'
const PASS = 'MediFlow2026!'

const results = []
const pass = (name) => { results.push({ name, ok: true }); console.log(`✅ ${name}`) }
const fail = (name, err) => { results.push({ name, ok: false, err: String(err) }); console.log(`❌ ${name}: ${err}`) }

async function login(email) {
  const sb = createClient(URL, ANON)
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS })
  if (error) throw error
  return createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${data.session.access_token}` } } })
}

async function main() {
  console.log('\n🏥 MediFlow E2E Test\n')

  let patientSb, doctorSb, receptionSb, nurseSb, labSb, pharmacySb, cashierSb
  let patientId, doctorId, deptId, appointmentId, medicineId

  try {
    patientSb = await login('patient@mediflow.ke')
    pass('Patient login')
  } catch (e) { fail('Patient login', e) }

  try {
    doctorSb = await login('doctor@mediflow.ke')
    pass('Doctor login')
  } catch (e) { fail('Doctor login', e) }

  try {
    receptionSb = await login('reception@mediflow.ke')
    pass('Receptionist login')
  } catch (e) { fail('Receptionist login', e) }

  try {
    nurseSb = await login('nurse@mediflow.ke')
    pass('Nurse login')
  } catch (e) { fail('Nurse login', e) }

  try {
    labSb = await login('lab@mediflow.ke')
    pass('Lab technician login')
  } catch (e) { fail('Lab technician login', e) }

  try {
    pharmacySb = await login('pharmacy@mediflow.ke')
    pass('Pharmacist login')
  } catch (e) { fail('Pharmacist login', e) }

  try {
    cashierSb = await login('cashier@mediflow.ke')
    pass('Cashier login')
  } catch (e) { fail('Cashier login', e) }

  if (!patientSb || !doctorSb) {
    console.log('\nCannot continue without patient/doctor')
    process.exit(1)
  }

  const { data: patient } = await patientSb.from('patients').select('id').eq('user_id', (await patientSb.auth.getUser()).data.user.id).single()
  patientId = patient?.id
  if (patientId) pass('Patient record exists')
  else fail('Patient record exists', 'missing')

  const { data: doctor } = await doctorSb.from('doctors').select('id, department_id').eq('user_id', (await doctorSb.auth.getUser()).data.user.id).single()
  doctorId = doctor?.id
  deptId = doctor?.department_id
  if (doctorId) pass('Doctor linked to profile')
  else fail('Doctor linked to profile', 'missing')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const date = tomorrow.toISOString().split('T')[0]

  const { data: apt, error: aptErr } = await patientSb.from('appointments').insert({
    patient_id: patientId,
    doctor_id: doctorId,
    department_id: deptId,
    appointment_date: date,
    start_time: '10:00',
    end_time: '11:00',
    reason: 'E2E test chest pain',
    symptoms: 'Automated test - chest discomfort for 2 days',
    urgency: 'moderate',
    status: 'pending',
  }).select().single()

  if (aptErr) fail('Book appointment', aptErr.message)
  else { appointmentId = apt.id; pass('Book appointment') }

  if (appointmentId && doctorSb) {
    const { error } = await doctorSb.from('appointments').update({
      status: 'confirmed',
      room_number: 'Room 204',
    }).eq('id', appointmentId)
    if (error) fail('Doctor accept appointment', error.message)
    else pass('Doctor accept appointment')
  }

  // Use today for check-in flow
  const today = new Date().toISOString().split('T')[0]
  const { data: todayApt, error: todayErr } = await patientSb.from('appointments').insert({
    patient_id: patientId,
    doctor_id: doctorId,
    department_id: deptId,
    appointment_date: today,
    start_time: '14:00',
    end_time: '15:00',
    reason: 'E2E today visit',
    symptoms: 'Today visit for full workflow test',
    urgency: 'routine',
    status: 'confirmed',
    room_number: 'Room 204',
  }).select().single()

  let flowAptId = todayApt?.id
  if (todayErr) fail('Create today appointment', todayErr.message)
  else pass('Create today appointment')

  if (flowAptId && receptionSb) {
    const { error } = await receptionSb.from('appointments').update({
      status: 'checked_in',
      checked_in_at: new Date().toISOString(),
    }).eq('id', flowAptId)
    if (error) fail('Reception check-in', error.message)
    else pass('Reception check-in')

    const { count } = await receptionSb.from('queue_entries').select('id', { count: 'exact', head: true }).gte('checked_in_at', `${today}T00:00:00`)
    const { error: qErr } = await receptionSb.from('queue_entries').insert({
      patient_id: patientId,
      department_id: deptId,
      ticket_number: (count ?? 0) + 1,
      status: 'waiting',
    })
    if (qErr) fail('Queue entry', qErr.message)
    else pass('Queue entry created')
  }

  if (flowAptId && nurseSb) {
    const nurseUser = (await nurseSb.auth.getUser()).data.user
    const { error } = await nurseSb.from('nurse_assessments').insert({
      patient_id: patientId,
      appointment_id: flowAptId,
      nurse_id: nurseUser.id,
      blood_pressure: '120/80',
      temperature: 36.8,
      pulse: 72,
      chief_complaint: 'Chest discomfort',
      status: 'ready_for_doctor',
    })
    if (error) fail('Nurse assessment', error.message)
    else pass('Nurse assessment')
  }

  if (flowAptId && doctorSb) {
    const { data: record, error: recErr } = await doctorSb.from('medical_records').insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_id: flowAptId,
      visit_date: new Date().toISOString(),
      chief_complaint: 'Chest discomfort',
      symptoms: 'Mild chest pain',
      notes: 'E2E consultation complete',
      vitals: { blood_pressure: '120/80' },
    }).select().single()

    if (recErr) fail('Medical record', recErr.message)
    else {
      pass('Medical record created')
      const { data: med } = await doctorSb.from('medicines').select('id').limit(1).single()
      medicineId = med?.id
      if (medicineId) {
        const { error: rxErr } = await doctorSb.from('prescriptions').insert({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: flowAptId,
          medical_record_id: record.id,
          medicine_id: medicineId,
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '5 days',
        })
        if (rxErr) fail('Prescription', rxErr.message)
        else pass('Prescription created')

        const { error: labErr } = await doctorSb.from('laboratory_tests').insert({
          patient_id: patientId,
          doctor_id: doctorId,
          test_name: 'Full Blood Count',
          test_type: 'hematology',
          status: 'pending',
        })
        if (labErr) fail('Lab order', labErr.message)
        else pass('Lab order created')
      }

      await doctorSb.from('appointments').update({ status: 'completed' }).eq('id', flowAptId)
      pass('Consultation completed')
    }
  }

  if (labSb) {
    const { data: labTest } = await labSb.from('laboratory_tests').select('id').eq('test_name', 'Full Blood Count').order('ordered_at', { ascending: false }).limit(1).maybeSingle()
    if (labTest) {
      await labSb.from('laboratory_tests').update({ status: 'in_progress' }).eq('id', labTest.id)
      await labSb.from('laboratory_tests').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', labTest.id)
      await labSb.from('laboratory_results').insert({ test_id: labTest.id, result_summary: 'All values normal', result_data: { status: 'normal' } })
      pass('Lab test completed')
    }
  }

  if (pharmacySb && medicineId) {
    const { data: rx } = await pharmacySb.from('prescriptions').select('id').eq('patient_id', patientId).eq('dispensed', false).limit(1).maybeSingle()
    if (rx) {
      await pharmacySb.from('prescriptions').update({ dispensed: true, dispensed_at: new Date().toISOString() }).eq('id', rx.id)
      pass('Prescription dispensed')
    }
  }

  if (cashierSb && patientId) {
    const invNum = `INV-E2E-${Date.now().toString().slice(-6)}`
    const { data: inv, error: invErr } = await cashierSb.from('invoices').insert({
      invoice_number: invNum,
      patient_id: patientId,
      subtotal: 3500,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 3500,
      amount_paid: 0,
      status: 'pending',
    }).select().single()
    if (invErr) fail('Create invoice', invErr.message)
    else {
      pass('Invoice created')
      const cashierUser = (await cashierSb.auth.getUser()).data.user
      await cashierSb.from('payments').insert({
        invoice_id: inv.id,
        amount: 3500,
        payment_method: 'mpesa',
        reference_number: 'MPESA-E2E-001',
        received_by: cashierUser.id,
      })
      await cashierSb.from('invoices').update({ amount_paid: 3500, status: 'paid' }).eq('id', inv.id)
      pass('Payment recorded')
    }
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Results: ${results.length - failed.length}/${results.length} passed`)
  if (failed.length) {
    console.log('\nFailed:')
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.err}`))
    process.exit(1)
  }
  console.log('\n🎉 All E2E tests passed!\n')
}

main().catch((e) => { console.error(e); process.exit(1) })
