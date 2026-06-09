class Users::DisableUser < ActiveInteraction::Base
  
  integer :id
  string :status_code

  validates :status_code, inclusion: { in: %w(enabled disabled) }
  
  def execute
    @user = User.find id
    @user.update( { status_code: status_code } )
    @user  
  end
end
