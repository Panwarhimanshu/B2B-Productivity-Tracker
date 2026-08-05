// Zone -> Team Lead emails who should be notified when an RM in that zone submits a report.
// Matched against Zone.name. Keep in sync with the HOD-provided zone/TL mapping sheet.
const ZONE_NOTIFY_RECIPIENTS = {
  North: ['hardik.kanan7567@gmail.com', 'harsh.vadgamaa@kanan.co', 'ketan.bagale@kanan.co', 'happy.5@kanan.co'],
  South: ['mukess.machhi@kanan.co'],
  West: ['mukess.machhi@kanan.co', 'soham@kananinternational.in'],
};

module.exports = { ZONE_NOTIFY_RECIPIENTS };
