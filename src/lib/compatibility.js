// Utility to calculate roommate / student compatibility score and detailed breakdown

export function calculateCompatibility(currentUser, otherUser) {
  if (!otherUser) return { percentage: 80, reasons: ['Both active on Gha Talaba'] }

  let score = 50 // Base compatibility baseline
  const reasons = []

  // 1. University match
  if (currentUser?.university && otherUser?.university && currentUser.university === otherUser.university) {
    score += 20
    reasons.push(`Attends ${currentUser.university}`)
  } else if (currentUser?.city && otherUser?.city && currentUser.city === otherUser.city) {
    score += 10
    reasons.push(`Based in ${currentUser.city}`)
  }

  // 2. City match
  if (currentUser?.city && otherUser?.city && currentUser.city === otherUser.city) {
    score += 15
    reasons.push(`Same city location (${currentUser.city})`)
  }

  // 3. Sleep Schedule match
  const mySleep = currentUser?.sleepSchedule || 'flexible'
  const otherSleep = otherUser?.sleepSchedule || 'earlyBird'
  if (mySleep === otherSleep || mySleep === 'flexible' || otherSleep === 'flexible') {
    score += 12
    reasons.push('Compatible sleep schedules')
  }

  // 4. Cleanliness match
  const myClean = currentUser?.cleanliness || 'strict'
  const otherClean = otherUser?.cleanliness || 'strict'
  if (myClean === otherClean) {
    score += 12
    reasons.push('Shared cleanliness standards')
  } else if (myClean !== 'relaxed' && otherClean !== 'relaxed') {
    score += 8
    reasons.push('Similar expectations for tidy spaces')
  }

  // 5. Study Vibe match
  const myStudy = currentUser?.studyVibe || 'quietFocus'
  const otherStudy = otherUser?.studyVibe || 'quietFocus'
  if (myStudy === otherStudy) {
    score += 10
    reasons.push('Matching study environment preferences')
  }

  // Ensure bounded score between 68% and 98%
  const finalPercentage = Math.min(98, Math.max(68, score))

  return {
    percentage: finalPercentage,
    reasons: reasons.length > 0 ? reasons : ['Active student verified profile', 'Compatible living preferences']
  }
}
