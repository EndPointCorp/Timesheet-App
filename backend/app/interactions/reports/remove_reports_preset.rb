class Reports::RemoveReportsPreset < ActiveInteraction::Base
  integer :user_id
  integer :preset_id
  
  validates :user_id, presence: true, numericality: { greater_than: 0 }
  validates :preset_id, presence: true

  validate :preset_exists

  def execute
    preset.destroy
  end

  def preset
    @_preset ||= ReportsPreset.where(id: preset_id, user_id: user_id).first
  end

  def preset_exists
    if preset.nil?
      errors.add(:base, 'Preset not found')
    end
  end  
end
