package recalibration

# MaintAInPro recalibration policy: trigger on incident, quarterly review, or process update
triggered {
  input.event == "incident"
}
triggered {
  input.event == "quarterly_review"
}
triggered {
  input.event == "process_update"
}
