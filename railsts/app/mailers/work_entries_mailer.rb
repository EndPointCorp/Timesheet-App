class WorkEntriesMailer < ActionMailer::Base
  default from: MAILER_FROM_EMAIL
    
  def notify_entry_changed(entry, before_text, user)
    refetched = WorkEntry.find entry.id
    @diff = Diffy::Diff.new(before_text, refetched.to_report).to_s(:html)
    @user = user
    mail(to: entry.owner.email, subject: "Your entry has been updated")
  end

end
